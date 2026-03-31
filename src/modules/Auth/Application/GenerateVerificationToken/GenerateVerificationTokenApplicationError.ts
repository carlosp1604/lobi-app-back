export class GenerateVerificationTokenApplicationError extends Error {
  public readonly __brand = 'GenerateVerificationTokenApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'generate_verification_token_invalid_email'
  public static invalidVerificationTokenPurposeId = 'generate_verification_token_invalid_verification_token_purpose'
  public static userNotFoundId = 'generate_verification_token_user_not_found'
  public static userDisabledId = 'generate_verification_token_user_disabled'
  public static activeTokenAlreadyIssuedId = 'generate_verification_token_active_token_already_issued'
  public static emailAlreadyTakenId = 'generate_verification_token_email_already_taken'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GenerateVerificationTokenApplicationError.name
  }

  public static invalidEmail(domainMessage: string) {
    return new GenerateVerificationTokenApplicationError(domainMessage, this.invalidEmailId)
  }

  public static invalidVerificationTokenPurpose(domainMessage: string) {
    return new GenerateVerificationTokenApplicationError(domainMessage, this.invalidVerificationTokenPurposeId)
  }

  public static userNotFound() {
    return new GenerateVerificationTokenApplicationError('No user was found for the provided email address', this.userNotFoundId)
  }

  public static userDisabled() {
    return new GenerateVerificationTokenApplicationError(
      'The user associated with this email address is currently disabled',
      this.userDisabledId,
    )
  }

  public static activeTokenAlreadyIssued() {
    return new GenerateVerificationTokenApplicationError(
      'An active verification token already exists for the requested action',
      this.activeTokenAlreadyIssuedId,
    )
  }

  public static emailAlreadyTaken() {
    return new GenerateVerificationTokenApplicationError('The provided email address is already registered', this.emailAlreadyTakenId)
  }
}
