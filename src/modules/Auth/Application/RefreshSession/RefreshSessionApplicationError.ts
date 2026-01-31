export class RefreshSessionApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'refresh_session_invalid_user_id'
  public static invalidTokenId = 'refresh_session_invalid_token'
  public static sessionNotFoundId = 'refresh_session_session_not_found'
  public static userMismatchId = 'refresh_session_user_mismatch'
  public static userNotFoundId = 'refresh_session_user_not_found'
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

  public static invalidUserId(userId: string) {
    return new RefreshSessionApplicationError(`Invalid user ID ${userId}`, this.invalidUserIdId)
  }

  public static invalidTokenFormat() {
    return new RefreshSessionApplicationError('Invalid token format', this.invalidTokenId)
  }

  public static sessionNotFound() {
    return new RefreshSessionApplicationError('UserSession was not found', this.sessionNotFoundId)
  }

  public static userMismatch() {
    return new RefreshSessionApplicationError('The provided userId does not match the owner of the refresh token', this.userMismatchId)
  }

  public static userNotFound(userId: string) {
    return new RefreshSessionApplicationError(`User identified by the ID ${userId} was not found`, this.userNotFoundId)
  }

  public static sessionAlreadyRevoked(sessionId: string) {
    return new RefreshSessionApplicationError(
      `UserSession identified by the ID ${sessionId} is already revoked`,
      this.sessionAlreadyRevokedId,
    )
  }

  public static sessionAlreadyExpired(sessionId: string) {
    return new RefreshSessionApplicationError(
      `UserSession identified by the ID ${sessionId} is already expired`,
      this.sessionAlreadyExpiredId,
    )
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
