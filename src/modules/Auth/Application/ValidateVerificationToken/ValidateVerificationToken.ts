import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'

export class ValidateVerificationToken {
  constructor(
    private readonly tokenRepository: VerificationTokenRepositoryInterface,
    private readonly verifyTokenService: VerifyTokenService,
    private readonly clockService: ClockServiceInterface,
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

    const tokenEntity = await this.tokenRepository.findByEmail(email.value)

    if (!tokenEntity) {
      return fail(ValidateVerificationTokenError.notFound())
    }

    try {
      tokenEntity.validate(now, email, verificationTokenPurpose)
    } catch (exception: unknown) {
      return this.handleDomainError(exception, verificationTokenPurpose)
    }

    const isCryptoValid = await this.verifyTokenService.verify(tokenEntity, tokenValue)

    if (!isCryptoValid) {
      return fail(ValidateVerificationTokenError.invalidToken())
    }

    return success(undefined)
  }

  private handleDomainError(exception: unknown, purpose: VerificationTokenPurpose): Result<void, ValidateVerificationTokenError> {
    if (!(exception instanceof VerificationTokenDomainException)) {
      throw exception
    }

    switch (exception.id) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId:
        return fail(ValidateVerificationTokenError.expired())

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId:
        return fail(ValidateVerificationTokenError.alreadyUsed())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId:
        return fail(ValidateVerificationTokenError.invalidOwner())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId:
        return fail(ValidateVerificationTokenError.invalidTokenPurpose(purpose.value))

      default:
        throw exception
    }
  }

  private validateEmail(email: string): Result<VerificationTokenEmail, ValidateVerificationTokenError> {
    try {
      return success(VerificationTokenEmail.fromString(email))
    } catch (exception: unknown) {
      if (!(exception instanceof VerificationTokenDomainException)) {
        throw exception
      }

      return fail(ValidateVerificationTokenError.invalidEmail(email))
    }
  }

  private validateVerificationTokenPurpose(purpose: string): Result<VerificationTokenPurpose, ValidateVerificationTokenError> {
    try {
      return success(VerificationTokenPurpose.fromString(purpose))
    } catch {
      return fail(ValidateVerificationTokenError.invalidTokenPurpose(purpose))
    }
  }

  private validateTokenValue(tokenValue: string): Result<string, ValidateVerificationTokenError> {
    try {
      const verificationTokenValue = VerificationTokenValue.fromString(tokenValue)

      return success(verificationTokenValue.value)
    } catch (exception: unknown) {
      if (!(exception instanceof VerificationTokenDomainException)) {
        throw exception
      }

      return fail(ValidateVerificationTokenError.invalidTokenFormat())
    }
  }
}
