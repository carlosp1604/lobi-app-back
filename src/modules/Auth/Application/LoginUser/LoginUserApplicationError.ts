export class LoginUserApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static userNotFoundId = 'user_login_user_not_found'
  public static invalidCredentialsId = 'user_login_invalid_credentials'
  public static userDoesNotHaveCredentialsId = 'user_login_user_does_not_have_credentials'
  public static invalidUserEmailId = 'user_login_invalid_user_email'
  public static cannotRevokeSessionsId = 'user_login_cannot_revoke_session'
  public static revocationFailedId = 'user_login_revocation_failed'
  public static internalErrorId = 'user_login_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = LoginUserApplicationError.name
  }

  public static userNotFound(userEmail: string) {
    return new LoginUserApplicationError(`User identified by the email ${userEmail} was not found`, this.userNotFoundId)
  }

  public static invalidCredentials(userId: string) {
    return new LoginUserApplicationError(`Invalid credentials for User identified by ID ${userId}`, this.invalidCredentialsId)
  }

  public static invalidUserEmail(userEmail: string) {
    return new LoginUserApplicationError(`Invalid user email ${userEmail}`, this.invalidUserEmailId)
  }

  public static userDoesNotHaveCredentials(userId: string) {
    return new LoginUserApplicationError(
      `User identified by ID ${userId} does not have credentials to local login`,
      this.userDoesNotHaveCredentialsId,
    )
  }

  public static cannotRevokeSession(message: string) {
    return new LoginUserApplicationError(message, this.cannotRevokeSessionsId)
  }

  public static revocationFailed(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.revocationFailedId)
  }

  public static internalError(errorMessage: string) {
    return new LoginUserApplicationError(errorMessage, this.internalErrorId)
  }
}
