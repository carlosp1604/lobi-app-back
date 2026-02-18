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
    private readonly verificationTokenRepository: VerificationTokenRepositoryInterface,
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

    const tokenEntity = await this.verificationTokenRepository.findByEmail(email.value)

    if (!tokenEntity) {
      return fail(ValidateVerificationTokenError.notFound())
    }

    const validateVerificationTokenResult = tokenEntity.validate(now, email, verificationTokenPurpose)

    if (!validateVerificationTokenResult.success) {
      return this.handleDomainError(validateVerificationTokenResult.error)
    }

    const isCryptoValid = await this.verifyTokenService.verify(tokenEntity, tokenValue)

    if (!isCryptoValid) {
      return fail(ValidateVerificationTokenError.invalidToken())
    }

    return success(undefined)
  }

  private handleDomainError(error: VerificationTokenDomainException): Result<void, ValidateVerificationTokenError> {
    switch (error.id) {
      case VerificationTokenDomainException.verificationTokenAlreadyExpiredId:
        return fail(ValidateVerificationTokenError.expired())

      case VerificationTokenDomainException.verificationTokenAlreadyUsedId:
        return fail(ValidateVerificationTokenError.alreadyUsed())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedByUserId:
        return fail(ValidateVerificationTokenError.invalidOwner())

      case VerificationTokenDomainException.verificationTokenCannotBeUsedForPurposeId:
        return fail(ValidateVerificationTokenError.tokenPurposeMismatch())

      default:
        throw error
    }
  }

  private validateEmail(email: string): Result<VerificationTokenEmail, ValidateVerificationTokenError> {
    const createVerificationTokenEmailResult = VerificationTokenEmail.safeCreate(email)

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
