export class RefreshSessionApplicationError extends Error {
  public readonly __brand = 'RefreshSessionApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidTokenFormatId = 'refresh_session_invalid_token_format'
  public static sessionNotFoundId = 'refresh_session_session_not_found'
  public static userNotFoundId = 'refresh_session_user_not_found'
  public static userDisabledId = 'refresh_session_user_disabled'
  public static sessionAlreadyRevokedId = 'refresh_session_session_already_revoked'
  public static sessionAlreadyExpiredId = 'refresh_session_session_already_expired'
  public static sessionInconsistencyId = 'refresh_session_session_inconsistency'
  public static revocationFailedId = 'refresh_session_revocation_failed'
  public static internalErrorId = 'refresh_session_internal_error'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = RefreshSessionApplicationError.name
  }

  public static invalidTokenFormat() {
    return new RefreshSessionApplicationError('Invalid token format', this.invalidTokenFormatId)
  }

  public static sessionNotFound() {
    return new RefreshSessionApplicationError('No session was found for the provided token', this.sessionNotFoundId)
  }

  public static userNotFound() {
    return new RefreshSessionApplicationError('The user associated with this session could not be found', this.userNotFoundId)
  }

  public static userDisabled() {
    return new RefreshSessionApplicationError('The user associated with this session is currently disabled', this.userDisabledId)
  }

  public static sessionAlreadyRevoked() {
    return new RefreshSessionApplicationError('The session has been revoked and is no longer valid', this.sessionAlreadyRevokedId)
  }

  public static sessionAlreadyExpired() {
    return new RefreshSessionApplicationError('The session has expired and is no longer valid', this.sessionAlreadyExpiredId)
  }

  public static sessionInconsistency(errorMessage: string) {
    return new RefreshSessionApplicationError(errorMessage, this.sessionInconsistencyId)
  }

  public static revocationFailed(errorMessage: string) {
    return new RefreshSessionApplicationError(errorMessage, this.revocationFailedId)
  }

  public static internalError(errorMessage: string) {
    return new RefreshSessionApplicationError(errorMessage, this.internalErrorId)
  }
}
