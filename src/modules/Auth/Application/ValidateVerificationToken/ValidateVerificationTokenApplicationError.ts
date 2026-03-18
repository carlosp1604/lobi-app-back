export class ValidateVerificationTokenError extends Error {
  public readonly __brand = 'ValidateVerificationTokenError' as const

  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'validate_verification_token_invalid_email'
  public static invalidTokenPurposeId = 'validate_verification_token_invalid_verification_token_purpose'
  public static invalidTokenFormatId = 'validate_verification_token_invalid_token_format'
  public static tokenNotFoundId = 'validate_verification_token_not_found'
  public static tokenExpiredId = 'validate_verification_token_expired'
  public static tokenAlreadyUsedId = 'validate_verification_token_already_used'
  public static tokenPurposeMismatchId = 'validate_verification_token_token_purpose_mismatch'
  public static invalidTokenOwnerId = 'validate_verification_token_invalid_owner'
  public static invalidTokenId = 'validate_verification_token_invalid_token'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = ValidateVerificationTokenError.name
  }

  public static invalidEmail(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.invalidEmailId)
  }

  public static invalidTokenPurpose(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.invalidTokenPurposeId)
  }

  public static invalidTokenFormat(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.invalidTokenFormatId)
  }

  public static notFound() {
    return new ValidateVerificationTokenError(
      'No valid verification token was found for the provided email address',
      this.tokenNotFoundId,
    )
  }

  public static expired(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.tokenExpiredId)
  }

  public static alreadyUsed(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.tokenAlreadyUsedId)
  }

  public static invalidOwner(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.invalidTokenOwnerId)
  }

  public static tokenPurposeMismatch(domainMessage: string) {
    return new ValidateVerificationTokenError(domainMessage, this.tokenPurposeMismatchId)
  }

  public static invalidToken() {
    return new ValidateVerificationTokenError('The provided verification code is incorrect', this.invalidTokenId)
  }
}
