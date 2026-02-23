import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'

export class ValidateVerificationToken {
  constructor(
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
    private readonly verifyTokenService: VerifyTokenService,
    private readonly clockService: ClockServiceInterface,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async execute(request: ValidateVerificationTokenApplicationRequestDto): Promise<Result<void, ValidateVerificationTokenError>> {
    const now = this.clockService.now()

    const emailValidationResult = this.validateEmail(request.email)
    const purposeValidationResult = this.validateVerificationTokenPurpose(request.purpose)
    const tokenValueValidationResult = this.validateTokenValue(request.token)

    if (!emailValidationResult.success) {
      return emailValidationResult
    }

    if (!purposeValidationResult.success) {
      return purposeValidationResult
    }

    if (!tokenValueValidationResult.success) {
      return tokenValueValidationResult
    }

    const email = emailValidationResult.value
    const verificationTokenPurpose = purposeValidationResult.value
    const tokenValue = tokenValueValidationResult.value

    const verificationToken = await this.verificationTokenRepository.findByEmail(email.value)

    if (!verificationToken) {
      return fail(ValidateVerificationTokenError.notFound())
    }

    const validateVerificationTokenResult = verificationToken.validate(now, email, verificationTokenPurpose)

    if (!validateVerificationTokenResult.success) {
      return this.handleDomainError(validateVerificationTokenResult.error, verificationToken)
    }

    const isCryptoValid = await this.verifyTokenService.verify(verificationToken, tokenValue)

    if (!isCryptoValid) {
      this.loggerService.warn('Token cryptography verification failed', {
        email: verificationToken.email.value,
      })

      return fail(ValidateVerificationTokenError.invalidToken())
    }

    return success(undefined)
  }

  private handleDomainError(
    exception: VerificationTokenDomainException,
    verificationToken: VerificationToken,
  ): Result<void, ValidateVerificationTokenError> {
    const tokenState = {
      verificationTokenId: verificationToken.id.value,
      email: verificationToken.email.value,
      expiresAt: verificationToken.expiresAt,
      usedAt: verificationToken.usedAt,
      purpose: verificationToken.purpose.value,
      error: exception.message,
    }

    switch (exception.id) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId:
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token has already expired',
        })
        return fail(ValidateVerificationTokenError.expired())

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId:
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was already used',
        })
        return fail(ValidateVerificationTokenError.alreadyUsed())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId:
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token belongs to a different email address',
        })
        return fail(ValidateVerificationTokenError.invalidOwner())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId:
        this.loggerService.warn('Verification token validation failed', {
          ...tokenState,
          reason: 'Token was not generated for the requested purpose',
        })
        return fail(ValidateVerificationTokenError.tokenPurposeMismatch())

      default:
        throw exception
    }
  }

  private validateEmail(email: string): Result<EmailAddress, ValidateVerificationTokenError> {
    const createVerificationTokenEmailResult = EmailAddress.safeCreate(email)

    if (!createVerificationTokenEmailResult.success) {
      return fail(ValidateVerificationTokenError.invalidEmail(email))
    }

    return success(createVerificationTokenEmailResult.value)
  }

  private validateVerificationTokenPurpose(purpose: string): Result<VerificationTokenPurpose, ValidateVerificationTokenError> {
    const createVerificationTokenPurposeResult = VerificationTokenPurpose.safeCreate(purpose)

    if (!createVerificationTokenPurposeResult.success) {
      return fail(ValidateVerificationTokenError.invalidTokenPurpose(purpose))
    }

    return success(createVerificationTokenPurposeResult.value)
  }

  private validateTokenValue(tokenValue: string): Result<string, ValidateVerificationTokenError> {
    const createVerificationTokenValueResult = VerificationTokenValue.safeCreate(tokenValue)

    if (!createVerificationTokenValueResult.success) {
      return fail(ValidateVerificationTokenError.invalidTokenFormat())
    }

    return success(createVerificationTokenValueResult.value.value)
  }
}
