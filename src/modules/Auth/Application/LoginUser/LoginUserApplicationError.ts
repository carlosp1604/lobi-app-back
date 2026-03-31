export class LoginUserApplicationError extends Error {
  public readonly __brand = 'LoginUserApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserEmailId = 'login_user_invalid_user_email'
  public static invalidPasswordFormatId = 'login_user_invalid_password_format'
  public static userNotFoundId = 'login_user_user_not_found'
  public static userDisabledId = 'login_user_user_disabled'
  public static invalidCredentialsId = 'login_user_invalid_credentials'
  public static userDoesNotHaveCredentialsId = 'login_user_user_does_not_have_credentials'
  public static revocationFailedId = 'login_user_revocation_failed'
  public static internalErrorId = 'login_user_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = LoginUserApplicationError.name
  }

  public static invalidUserEmail(domainMessage: string) {
    return new LoginUserApplicationError(domainMessage, this.invalidUserEmailId)
  }

  public static invalidPasswordFormat(domainMessage: string) {
    return new LoginUserApplicationError(domainMessage, this.invalidPasswordFormatId)
  }

  public static userNotFound() {
    return new LoginUserApplicationError('No user was found for the provided email address', this.userNotFoundId)
  }

  public static userDisabled() {
    return new LoginUserApplicationError('The user associated with this email address is currently disabled', this.userDisabledId)
  }

  public static invalidCredentials() {
    return new LoginUserApplicationError('The provided credentials are incorrect', this.invalidCredentialsId)
  }

  public static userDoesNotHaveCredentials() {
    return new LoginUserApplicationError('The user does not have a password set for local login', this.userDoesNotHaveCredentialsId)
  }

  public static revocationFailed(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.revocationFailedId)
  }

  public static internalError(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.internalErrorId)
  }
}
