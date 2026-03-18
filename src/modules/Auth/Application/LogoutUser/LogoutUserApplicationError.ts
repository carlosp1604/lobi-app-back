export class LogoutUserApplicationError extends Error {
  public readonly __brand = 'LogoutUserApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'logout_user_invalid_user_id'
  public static invalidSessionIdId = 'logout_user_invalid_session_id'
  public static userNotFoundId = 'logout_user_user_not_found'
  public static userDisabledId = 'logout_user_user_disabled'
  public static sessionNotFoundId = 'logout_user_session_not_found'
  public static sessionDoesNotBelongToUserId = 'logout_user_session_does_not_belong_to_user'
  public static cannotRevokeSessionId = 'logout_user_cannot_revoke_session'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = LogoutUserApplicationError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new LogoutUserApplicationError(domainMessage, this.invalidUserIdId)
  }

  public static invalidSessionId(domainMessage: string) {
    return new LogoutUserApplicationError(domainMessage, this.invalidSessionIdId)
  }

  public static userNotFound() {
    return new LogoutUserApplicationError('The user associated with this session could not be found', this.userNotFoundId)
  }

  public static userDisabled() {
    return new LogoutUserApplicationError('The user associated with this session is currently disabled', this.userDisabledId)
  }

  public static sessionNotFound() {
    return new LogoutUserApplicationError('No session was found for the provided session identifier', this.sessionNotFoundId)
  }

  public static sessionDoesNotBelongToUser() {
    return new LogoutUserApplicationError(
      'The provided session does not belong to the provider user identifier',
      this.sessionDoesNotBelongToUserId,
    )
  }

  public static cannotRevokeSession(domainMessage: string) {
    return new LogoutUserApplicationError(domainMessage, this.cannotRevokeSessionId)
  }
}
