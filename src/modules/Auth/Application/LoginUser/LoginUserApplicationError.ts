export class LoginUserApplicationError extends Error {
  public readonly __brand = 'LoginUserApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static userNotFoundId = 'login_user_user_not_found'
  public static userDisabledId = 'login_user_user_disabled'
  public static invalidCredentialsId = 'login_user_invalid_credentials'
  public static userDoesNotHaveCredentialsId = 'login_user_user_does_not_have_credentials'
  public static invalidUserEmailId = 'login_user_invalid_user_email'
  public static invalidPasswordFormatId = 'login_user_invalid_password_format'
  public static revocationFailedId = 'login_user_revocation_failed'
  public static internalErrorId = 'login_user_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = LoginUserApplicationError.name
  }

  public static userNotFound(userEmail: string) {
    return new LoginUserApplicationError(`User identified by the email ${userEmail} was not found`, this.userNotFoundId)
  }

  public static userDisabled(userEmail: string) {
    return new LoginUserApplicationError(`User identified by the email ${userEmail} is disabled`, this.userDisabledId)
  }

  public static invalidCredentials(userId: string) {
    return new LoginUserApplicationError(`Invalid credentials for User identified by ID ${userId}`, this.invalidCredentialsId)
  }

  public static invalidUserEmail(userEmail: string) {
    return new LoginUserApplicationError(`Invalid user email ${userEmail}`, this.invalidUserEmailId)
  }

  public static invalidPasswordFormat() {
    return new LoginUserApplicationError(
      'Password must be 8–128 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character',
      this.invalidPasswordFormatId,
    )
  }

  public static userDoesNotHaveCredentials(userId: string) {
    return new LoginUserApplicationError(
      `User identified by ID ${userId} does not have credentials to local login`,
      this.userDoesNotHaveCredentialsId,
    )
  }

  public static revocationFailed(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.revocationFailedId)
  }

  public static internalError(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.internalErrorId)
  }
}
