export class ResetUserPasswordApplicationError {
  public readonly id: string
  public readonly name: string
  public readonly errors: Array<ResetUserPasswordError>

  public static invalidInputId = 'reset_user_password_application_invalid_input'
  public static notFoundId = 'reset_user_password_application_not_found'
  public static invalidTokenId = 'reset_user_password_application_invalid_token'
  public static cannotResetPasswordId = 'reset_user_password_application_cannot_reset_password'
  public static inconsistentStateId = 'reset_user_password_application_inconsistent_state'

  private constructor(id: string, errors: Array<ResetUserPasswordError>) {
    this.id = id
    this.name = ResetUserPasswordApplicationError.name
    this.errors = errors
  }

  public static invalidInput(errors: Array<ResetUserPasswordError>) {
    return new ResetUserPasswordApplicationError(this.invalidInputId, errors)
  }

  public static notFound(error: ResetUserPasswordError) {
    return new ResetUserPasswordApplicationError(this.notFoundId, [error])
  }

  public static invalidToken(error: ResetUserPasswordError) {
    return new ResetUserPasswordApplicationError(this.invalidTokenId, [error])
  }

  public static cannotResetPassword() {
    return new ResetUserPasswordApplicationError(this.cannotResetPasswordId, [ResetUserPasswordError.samePasswordValue()])
  }

  public static inconsistentState(userId: string): ResetUserPasswordApplicationError {
    return new ResetUserPasswordApplicationError(this.inconsistentStateId, [ResetUserPasswordError.userDoesNotHaveCredentials(userId)])
  }
}

export class ResetUserPasswordError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'reset_user_password_error_invalid_email'
  public static invalidPasswordId = 'reset_user_password_error_invalid_password'
  public static invalidTokenFormatId = 'reset_user_password_error_invalid_token_format'
  public static tokenNotFoundId = 'reset_user_password_error_token_not_found'
  public static userNotFoundId = 'reset_user_password_error_user_not_found'
  public static userDoesNotHaveCredentialsId = 'reset_user_password_error_user_does_not_have_credentials'
  public static samePasswordValueId = 'reset_user_password_error_same_password_value'
  public static invalidVerificationTokenId = 'reset_user_password_error_invalid_verification_token'
  public static tokenExpiredId = 'reset_user_password_error_token_expired'
  public static tokenAlreadyUsedId = 'reset_user_password_error_token_already_used'
  public static tokenInvalidOwnerId = 'reset_user_password_error_token_invalid_owner'
  public static tokenPurposeMismatchId = 'reset_user_password_error_token_purpose_mismatch'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = ResetUserPasswordError.name
  }

  public static invalidEmail() {
    return new ResetUserPasswordError('Invalid email', this.invalidEmailId)
  }

  public static invalidPassword() {
    return new ResetUserPasswordError('Invalid password', this.invalidPasswordId)
  }

  public static invalidTokenFormat() {
    return new ResetUserPasswordError('Invalid token format', this.invalidTokenFormatId)
  }

  public static tokenNotFound(email: string) {
    return new ResetUserPasswordError(`Token associated to email ${email} was not found`, this.tokenNotFoundId)
  }

  public static userNotFound(userEmail: string) {
    return new ResetUserPasswordError(`User identified by the email ${userEmail} was not found`, this.userNotFoundId)
  }

  public static userDoesNotHaveCredentials(userId: string) {
    return new ResetUserPasswordError(
      `User identified by ID ${userId} does not have credentials to local login`,
      this.userDoesNotHaveCredentialsId,
    )
  }

  public static samePasswordValue() {
    return new ResetUserPasswordError('New password cannot be the same as the current password', this.samePasswordValueId)
  }

  public static invalidToken() {
    return new ResetUserPasswordError('The provided token code does not match the stored hash', this.invalidVerificationTokenId)
  }

  public static tokenExpired() {
    return new ResetUserPasswordError('The verification token has already expired', this.tokenExpiredId)
  }

  public static tokenAlreadyUsed() {
    return new ResetUserPasswordError('The verification token has already been used', this.tokenAlreadyUsedId)
  }

  public static tokenInvalidOwner() {
    return new ResetUserPasswordError('The verification token does not belong to the provided email address', this.tokenInvalidOwnerId)
  }

  public static tokenPurposeMismatch() {
    return new ResetUserPasswordError('The token cannot be used for the requested purpose', this.tokenPurposeMismatchId)
  }
}
