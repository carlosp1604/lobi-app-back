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

  public static inconsistentState(): ResetUserPasswordApplicationError {
    return new ResetUserPasswordApplicationError(this.inconsistentStateId, [ResetUserPasswordError.userDoesNotHaveCredentials()])
  }
}

export class ResetUserPasswordError extends Error {
  public readonly __brand = 'ResetUserPasswordError' as const

  public readonly id: string
  public readonly name: string

  public static invalidEmailId = 'reset_user_password_error_invalid_email'
  public static invalidPasswordId = 'reset_user_password_error_invalid_password'
  public static invalidTokenFormatId = 'reset_user_password_error_invalid_token_format'
  public static tokenNotFoundId = 'reset_user_password_error_token_not_found'
  public static userNotFoundId = 'reset_user_password_error_user_not_found'
  public static userDisabledId = 'reset_user_password_error_user_disabled'
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

  public static invalidEmail(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.invalidEmailId)
  }

  public static invalidPassword(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.invalidPasswordId)
  }

  public static invalidTokenFormat(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.invalidTokenFormatId)
  }

  public static tokenNotFound() {
    return new ResetUserPasswordError('No valid verification token was found for the provided email address', this.tokenNotFoundId)
  }

  public static userNotFound() {
    return new ResetUserPasswordError('No user was found for the provided email address', this.userNotFoundId)
  }

  public static userDisabled() {
    return new ResetUserPasswordError('The user associated with this email address is currently disabled', this.userDisabledId)
  }

  public static userDoesNotHaveCredentials() {
    return new ResetUserPasswordError('The user does not have a password set for local login', this.userDoesNotHaveCredentialsId)
  }

  public static samePasswordValue() {
    return new ResetUserPasswordError('New password cannot be the same as the current password', this.samePasswordValueId)
  }

  public static tokenExpired(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.tokenExpiredId)
  }

  public static tokenAlreadyUsed(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.tokenAlreadyUsedId)
  }

  public static tokenInvalidOwner(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.tokenInvalidOwnerId)
  }

  public static tokenPurposeMismatch(domainMessage: string) {
    return new ResetUserPasswordError(domainMessage, this.tokenPurposeMismatchId)
  }

  public static invalidToken() {
    return new ResetUserPasswordError('The provided verification code is incorrect', this.invalidVerificationTokenId)
  }
}
