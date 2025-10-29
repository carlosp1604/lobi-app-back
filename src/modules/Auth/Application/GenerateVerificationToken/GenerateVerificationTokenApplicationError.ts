export class GenerateVerificationTokenApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'generate_verification_token_invalid_email'
  public static invalidVerificationTokenPurposeId = 'generate_verification_token_invalid_verification_token_purpose'
  public static activeTokenAlreadyIssuedId = 'generate_verification_token_active_token_already_issued'
  public static internalErrorId = 'generate_verification_token_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GenerateVerificationTokenApplicationError.name
  }

  public static invalidEmail(email: string) {
    return new GenerateVerificationTokenApplicationError(`Invalid email ${email}`, this.invalidEmailId)
  }

  public static invalidVerificationTokenPurpose(purpose: string) {
    return new GenerateVerificationTokenApplicationError(
      `Invalid VerificationToken purpose ${purpose}`,
      this.invalidVerificationTokenPurposeId,
    )
  }

  public static activeTokenAlreadyIssued(email: string, purpose: string) {
    return new GenerateVerificationTokenApplicationError(
      `An active VerificationToken for ${purpose} was already issued for email ${email}`,
      this.activeTokenAlreadyIssuedId,
    )
  }

  public static internalError(errorMessage: string) {
    return new GenerateVerificationTokenApplicationError(errorMessage, this.internalErrorId)
  }
}
