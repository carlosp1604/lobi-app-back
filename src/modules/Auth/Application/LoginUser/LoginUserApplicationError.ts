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

  public static userNotFound(userEmail: string) {
    return new LoginUserApplicationError(`User identified by email ${userEmail} was not found`, this.userNotFoundId)
  }

  public static userDisabled(userEmail: string) {
    return new LoginUserApplicationError(`User identified by email ${userEmail} is disabled`, this.userDisabledId)
  }

  public static invalidCredentials(userId: string) {
    return new LoginUserApplicationError(`Invalid credentials for User identified by ID ${userId}`, this.invalidCredentialsId)
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
