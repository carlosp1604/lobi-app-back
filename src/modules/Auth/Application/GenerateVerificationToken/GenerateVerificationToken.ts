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
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { TemplateAlias, VerificationEmailContext } from '~/src/modules/Shared/Domain/EmailTemplates'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

export class GenerateVerificationToken {
  private readonly verificationTokenTtlMs: number

  constructor(
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly emailSenderService: EmailSenderServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly hasherService: HasherServiceInterface,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly randomService: RandomServiceInterface,
    private readonly configService: ConfigService<Env, true>,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly authDomainEventFactory: AuthDomainEventFactory,
  ) {
    this.verificationTokenTtlMs = this.configService.get('VERIFICATION_TOKEN_TTL_MS', { infer: true })
  }

  public async execute(
    request: GenerateVerificationTokenApplicationRequestDto,
  ): Promise<Result<void, GenerateVerificationTokenApplicationError>> {
    const now = this.clockService.now()

    // TODO: Validate language from request when multi-language emails are supported
    const language = 'es'

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

    const user = await this.userRepository.findByEmail(email.value)

    if (verificationTokenPurpose.equals(VerificationTokenPurpose.createAccount())) {
      if (user) {
        this.loggerService.warn('Verification token generation rejected', {
          email: email.value,
          reason: 'Email is already registered and purpose is create account',
        })

        return fail(GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.value))
      }
    }

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      email: email.value,
    })

    if (verificationTokenPurpose.equals(VerificationTokenPurpose.resetPassword())) {
      if (!user || !user.isActive()) {
        this.loggerService.warn('Verification token generation rejected', {
          email: email.value,
          reason: user ? 'User is disabled' : 'User not found',
          purpose: verificationTokenPurpose.value,
        })

        return success(undefined)
      }
    }

    return this.unitOfWork.runInTransaction(async (context) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(email.value, context)

      let resendCode = false

      if (verificationToken) {
        const validateTokenResult = verificationToken.validate(now, email, verificationTokenPurpose)

        const isVerificationTokenUsable = validateTokenResult.success

        if (isVerificationTokenUsable && !request.sendNewToken) {
          this.loggerService.warn('Verification token generation rejected', {
            email: email.value,
            purpose: verificationTokenPurpose.value,
            tokenId: verificationToken.id.value,
            tokenExpiresAt: verificationToken.expiresAt,
            reason: 'An active token has already been issued for this purpose',
          })

          return fail(GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.value, verificationTokenPurpose.value))
        }

        if (!verificationToken.isUsed()) {
          await this.verificationTokenRepository.delete(verificationToken.id.value, context)
        }

        if (request.sendNewToken) {
          resendCode = true
        }
      }

      const clearRandomCode = this.randomService.getRandomNumericCode(VerificationTokenValue.LENGTH)
      const hashedCode = await this.hasherService.hash(clearRandomCode)
      const tokenHash = VerificationTokenTokenHash.fromString(hashedCode)
      const verificationTokenId = this.idGeneratorService.generateId()

      const newVerificationToken = VerificationToken.create(
        Identifier.fromString(verificationTokenId),
        email,
        tokenHash,
        verificationTokenPurpose,
        this.verificationTokenTtlMs,
        now,
      )

      const domainEvent = this.authDomainEventFactory.createEmailVerificationRequestEvent(
        newVerificationToken,
        resendCode,
        language,
        deviceLocation,
        userAgent,
        ipHash,
        now,
      )

      await this.domainEventRepository.save(domainEvent, context)
      await this.verificationTokenRepository.save(newVerificationToken, context)

      // TODO: This use-case should not send the email. Remove this step when domain-event handler worker is ready
      await this.sendEmail(email, verificationTokenPurpose, clearRandomCode, language, now)

      return success(undefined)
    })
  }

  private validateEmail(email: string): Result<EmailAddress, GenerateVerificationTokenApplicationError> {
    const createVerificationTokenEmailResult = EmailAddress.safeCreate(email)

    if (!createVerificationTokenEmailResult.success) {
      return fail(GenerateVerificationTokenApplicationError.invalidEmail(email))
    }

    return success(createVerificationTokenEmailResult.value)
  }

  private validateVerificationTokenPurpose(
    purpose: string,
  ): Result<VerificationTokenPurpose, GenerateVerificationTokenApplicationError> {
    const createVerificationTokenPurposeResult = VerificationTokenPurpose.safeCreate(purpose)

    if (!createVerificationTokenPurposeResult.success) {
      return fail(GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose(purpose))
    }

    return success(createVerificationTokenPurposeResult.value)
  }

  private async sendEmail(
    email: EmailAddress,
    purpose: VerificationTokenPurpose,
    clearRandomCode: string,
    language: string,
    now: Date,
  ): Promise<void> {
    const templateAlias: TemplateAlias = purpose.equals(VerificationTokenPurpose.createAccount())
      ? 'verify-email-template-create-account'
      : 'verify-email-template-reset-password'

    const expirationMinutes = this.verificationTokenTtlMs / (60 * 1000) // ms to min

    const context: VerificationEmailContext = {
      token: clearRandomCode,
      expiration_minutes: expirationMinutes,
    }

    await this.emailSenderService.sendWithTemplate(email.value, templateAlias, context, language, now)
  }
}
