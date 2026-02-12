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
import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'
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
import { TemplateAlias, VerificationEmailContext } from '~/src/modules/Shared/Domain/EmailTemplates'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'

export class GenerateVerificationToken {
  private readonly verificationTokenTtlMs: number
  private readonly verificationTokenLength: number

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
  ) {
    this.verificationTokenTtlMs = this.configService.get('VERIFICATION_TOKEN_TTL_MS', { infer: true })
    this.verificationTokenLength = this.configService.get('VERIFICATION_TOKEN_LENGTH', { infer: true })
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

    const user = await this.userRepository.findByEmail(email.toString())

    if (verificationTokenPurpose.equals(VerificationTokenPurpose.createAccount())) {
      if (user) {
        this.loggerService.warn('Create account requested for an already taken email', {
          email: email.toString(),
        })

        return fail(GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.toString()))
      }
    }

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      email: email.toString(),
    })

    if (verificationTokenPurpose.equals(VerificationTokenPurpose.resetPassword())) {
      if (!user || user.deletedAt || !user.status.equals(UserStatus.active())) {
        this.loggerService.warn('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: user ? 'Inactive' : 'NotFound',
          ip: request.ip.slice(0, 39),
          userAgent: userAgent.toString(),
        })

        return success(undefined)
      }
    }

    return this.unitOfWork.runInTransaction(async (context) => {
      const verificationToken = await this.verificationTokenRepository.findByEmailWithLock(email.toString(), context)

      let resendCode = false

      if (verificationToken) {
        const isVerificationTokenUsable = verificationToken.canBeUsedForPurpose(now, email, verificationTokenPurpose)

        if (isVerificationTokenUsable && !request.sendNewToken) {
          this.loggerService.warn('Email has already an active token for purpose', {
            email: email.toString(),
            purpose: verificationTokenPurpose.toString(),
            tokenId: verificationToken.id,
            tokenExpiresAt: verificationToken.expiresAt.toISOString(),
          })

          return fail(
            GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.toString(), verificationTokenPurpose.toString()),
          )
        }

        if (!verificationToken.isUsed()) {
          await this.verificationTokenRepository.delete(verificationToken.id.toString(), context)
        }

        if (request.sendNewToken) {
          resendCode = true
        }
      }

      const clearRandomCode = this.randomService.getRandomNumericCode(this.verificationTokenLength)
      const hashedCode = await this.hasherService.hash(clearRandomCode)
      const tokenHash = VerificationTokenTokenHash.fromString(hashedCode)
      const verificationTokenId = this.idGeneratorService.generateId()
      const domainEventId = this.idGeneratorService.generateId()

      const newVerificationToken = VerificationToken.create(
        VerificationTokenId.fromString(verificationTokenId),
        email,
        tokenHash,
        verificationTokenPurpose,
        this.verificationTokenTtlMs,
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
          resendCode,
          lang: request.language,
          deviceLocation: deviceLocation
            ? {
                city: deviceLocation.city,
                countryCode: deviceLocation.countryCode,
              }
            : null,
        },
        {
          ipHash: ipHash ? ipHash.toString() : null,
          ua: userAgent.toString(),
        },
        now,
      )

      await this.domainEventRepository.save(domainEvent, context)
      await this.verificationTokenRepository.save(newVerificationToken, context)

      // TODO: This use-case should not send the email. Remove this step when domain-event handler worker is ready
      // TODO: Validate input language when multi-language emails are supported
      await this.sendEmail(email, verificationTokenPurpose, clearRandomCode, request.language, now)

      return success(undefined)
    })
  }

  private validateEmail(email: string): Result<VerificationTokenEmail, GenerateVerificationTokenApplicationError> {
    try {
      return success(VerificationTokenEmail.fromString(email))
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

  private async sendEmail(
    email: EmailAddressValueObject,
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

    await this.emailSenderService.sendWithTemplate(email.toString(), templateAlias, context, language, now)
  }
}
