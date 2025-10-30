import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { GenerateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationRequestDto'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { RandomServiceInterface } from '~/src/modules/Shared/Domain/RandomServiceInterface'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { VerificationEmailContext } from '~/src/modules/Shared/Domain/EmailTemplates'

export class GenerateVerificationToken {
  private readonly verificationTokenTtlMs: number
  private readonly verificationTokenLength: number
  private readonly productName: string
  private readonly companyName: string

  constructor(
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly emailSenderService: EmailSenderServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly hasherService: HasherServiceInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly randomService: RandomServiceInterface,
    private readonly configService: ConfigService<Env, true>,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
  ) {
    this.verificationTokenTtlMs = this.configService.get('VERIFICATION_TOKEN_TTL_MS', { infer: true })
    this.verificationTokenLength = this.configService.get('VERIFICATION_TOKEN_LENGTH', { infer: true })
    this.productName = this.configService.get('EMAIL_APP_NAME', { infer: true })
    this.companyName = this.configService.get('EMAIL_COMPANY_NAME', { infer: true })
  }

  public async execute(
    request: GenerateVerificationTokenApplicationRequestDto,
  ): Promise<Result<void, GenerateVerificationTokenApplicationError>> {
    const now = this.clockService.now()

    const emailValidationResult = this.validateEmail(request.email)
    const purposeValidationResult = this.validateVerificationTokenPurpose(request.purpose)

    if (!emailValidationResult.success) {
      return emailValidationResult
    }

    if (!purposeValidationResult.success) {
      return purposeValidationResult
    }

    const email = emailValidationResult.value
    const verificationTokenPurpose = purposeValidationResult.value

    return this.unitOfWork.runInTransaction(async (context) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailAndPurposeWithLock(
        email.toString(),
        verificationTokenPurpose.toString(),
        context,
      )

      let resendCode = false

      if (verificationToken) {
        if (!request.sendNewToken) {
          const isVerificationTokenUsable = verificationToken.canBeUsedForPurpose(now, email, verificationTokenPurpose)

          if (isVerificationTokenUsable) {
            return fail(
              GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.toString(), verificationTokenPurpose.toString()),
            )
          }
        } else {
          await this.verificationTokenRepository.delete(verificationToken.id.toString(), context)
          resendCode = true
        }
      }

      const clearRandomCode = this.randomService.getRandomNumericCode(this.verificationTokenLength)
      const hashedCode = await this.hasherService.hash(clearRandomCode)
      const tokenHash = VerificationTokenTokenHash.fromString(hashedCode)
      const verificationTokenExpiresAt = new Date(now.getTime() + this.verificationTokenTtlMs)
      const verificationTokenId = this.idGeneratorService.generateId()
      const domainEventId = this.idGeneratorService.generateId()

      const newVerificationToken = VerificationToken.create(
        VerificationTokenId.fromString(verificationTokenId),
        email,
        tokenHash,
        verificationTokenPurpose,
        verificationTokenExpiresAt,
        now,
      )

      const domainEvent = DomainEvent.create(
        DomainEventId.fromString(domainEventId),
        DomainEventName.emailVerificationRequest(),
        DomainEventAggregateType.verificationToken(),
        DomainEventAggregateId.fromString(verificationTokenId),
        {
          email: email.toString(),
          purpose: verificationTokenPurpose.toString(),
          code: clearRandomCode,
          resendCode,
          lang: request.language,
        },
        {},
        now,
      )

      await this.domainEventRepository.save(domainEvent, context)
      await this.verificationTokenRepository.save(newVerificationToken, context)

      // TODO: This use-case should not send the email. Remove this step when domain-event handler worker is ready
      await this.sendEmail(email, verificationTokenPurpose, clearRandomCode, now)

      return success(undefined)
    })
  }

  private validateEmail(email: string): Result<UserEmail, GenerateVerificationTokenApplicationError> {
    try {
      return success(UserEmail.fromString(email))
    } catch {
      return fail(GenerateVerificationTokenApplicationError.invalidEmail(email))
    }
  }

  private validateVerificationTokenPurpose(
    purpose: string,
  ): Result<VerificationTokenPurpose, GenerateVerificationTokenApplicationError> {
    try {
      return success(VerificationTokenPurpose.fromString(purpose))
    } catch {
      return fail(GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose(purpose))
    }
  }

  private async sendEmail(email: UserEmail, purpose: VerificationTokenPurpose, clearRandomCode: string, now: Date): Promise<void> {
    const currentYear = now.getFullYear()

    const context: VerificationEmailContext = {
      is_signup: purpose.equals(VerificationTokenPurpose.createAccount()),
      is_password_reset: purpose.equals(VerificationTokenPurpose.resetPassword()),
      token: clearRandomCode,
      product_name: this.productName,
      company_name: this.companyName,
      current_year: currentYear,
      // TODO: Extract this operation to a shared function
      expiration_minutes: this.verificationTokenTtlMs / (60 * 1000),
      lang_es: true,
    }

    await this.emailSenderService.sendWithTemplate(email.toString(), 'verify-email-template', context)
  }
}
