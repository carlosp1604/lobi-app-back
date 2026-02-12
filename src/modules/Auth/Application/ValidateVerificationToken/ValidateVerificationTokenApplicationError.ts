import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class ValidateVerificationTokenError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'validate_verification_token_invalid_email'
  public static invalidTokenPurposeId = 'validate_verification_token_invalid_verification_token_purpose'
  public static invalidTokenFormatId = 'validate_verification_token_invalid_token_format'
  public static tokenNotFoundId = 'validate_verification_token_not_found'
  public static tokenExpiredId = 'validate_token_expired'
  public static tokenAlreadyUsedId = 'validate_token_already_used'
  public static invalidTokenOwnerId = 'validate_token_invalid_owner'
  public static invalidTokenId = 'validate_token_invalid_token'
  public static internalErrorId = 'validate_token_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = ValidateVerificationTokenError.name
  }

  public static invalidEmail(email: string) {
    const cleanEmail = StringFormatter.formatSafe(email, 60)
    return new ValidateVerificationTokenError(`Invalid email: ${cleanEmail}`, this.invalidEmailId)
  }

  public static invalidTokenPurpose(purpose: string) {
    const safePurposeSample = StringFormatter.formatSafe(purpose, 60)
    return new ValidateVerificationTokenError(`Invalid VerificationToken purpose: ${safePurposeSample}`, this.invalidTokenPurposeId)
  }

  public static invalidTokenFormat() {
    return new ValidateVerificationTokenError('Invalid token format', this.invalidTokenFormatId)
  }

  public static notFound() {
    return new ValidateVerificationTokenError('Verification token was not found', this.tokenNotFoundId)
  }

  public static expired() {
    return new ValidateVerificationTokenError('The verification token has expired', this.tokenExpiredId)
  }

  public static alreadyUsed() {
    return new ValidateVerificationTokenError('The verification token has already been used', this.tokenAlreadyUsedId)
  }

  public static invalidOwner() {
    return new ValidateVerificationTokenError(
      'The verification token does not belong to the provided email address',
      this.invalidTokenOwnerId,
    )
  }

  public static invalidToken() {
    return new ValidateVerificationTokenError('The provided token code does not match the stored hash', this.invalidTokenId)
  }

  public static internalError(errorMessage: string) {
    return new ValidateVerificationTokenError(`Internal error during token validation: ${errorMessage}`, this.internalErrorId)
  }
}
