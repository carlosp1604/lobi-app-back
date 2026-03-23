export class CloseUserSessionApplicationError extends Error {
  public readonly __brand = 'CloseUserSessionApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'close_user_session_invalid_user_id'
  public static invalidSessionIdId = 'close_user_session_invalid_session_id'
  public static invalidCurrentSessionIdId = 'close_user_session_invalid_current_session_id'
  public static userNotFoundId = 'close_user_session_user_not_found'
  public static userDisabledId = 'close_user_session_user_disabled'
  public static sessionNotFoundId = 'close_user_session_session_not_found'
  public static sessionDoesNotBelongToUserId = 'close_user_session_session_does_not_belong_to_user'
  public static cannotRevokeSessionId = 'close_user_session_cannot_revoke_session'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = CloseUserSessionApplicationError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new CloseUserSessionApplicationError(domainMessage, this.invalidUserIdId)
  }

  public static invalidSessionId(domainMessage: string) {
    return new CloseUserSessionApplicationError(domainMessage, this.invalidSessionIdId)
  }

  public static invalidCurrentSessionId(domainMessage: string) {
    return new CloseUserSessionApplicationError(domainMessage, this.invalidCurrentSessionIdId)
  }

  public static userNotFound() {
    return new CloseUserSessionApplicationError('The user associated with this session could not be found', this.userNotFoundId)
  }

  public static userDisabled() {
    return new CloseUserSessionApplicationError('The user associated with this session is currently disabled', this.userDisabledId)
  }

  public static sessionNotFound() {
    return new CloseUserSessionApplicationError('No session was found for the provided session identifier', this.sessionNotFoundId)
  }

  public static sessionDoesNotBelongToUser() {
    return new CloseUserSessionApplicationError(
      'The provided session does not belong to the provider user identifier',
      this.sessionDoesNotBelongToUserId,
    )
  }

  public static cannotRevokeSession(domainMessage: string) {
    return new CloseUserSessionApplicationError(domainMessage, this.cannotRevokeSessionId)
  }
}
