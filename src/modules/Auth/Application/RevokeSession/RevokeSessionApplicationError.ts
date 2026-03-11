export class RevokeSessionApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidInputId = 'revoke_session_invalid_input'
  public static userNotFoundId = 'revoke_session_user_not_found'
  public static userDisabledId = 'revoke_session_user_disabled'
  public static sessionNotFoundId = 'revoke_session_session_not_found'
  public static sessionDoesNotBelongToUserId = 'revoke_session_session_does_not_belong_to_user'
  public static cannotRevokeSessionId = 'revoke_session_cannot_revoke_session'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = RevokeSessionApplicationError.name
  }

  public static invalidInput(field: string, errorMessage: string) {
    return new RevokeSessionApplicationError(`Invalid input provided for field ${field}. Reason: ${errorMessage}`, this.invalidInputId)
  }

  public static userNotFound(userId: string) {
    return new RevokeSessionApplicationError(`User identified by ID ${userId} was not found`, this.userNotFoundId)
  }

  public static userDisabled(userId: string) {
    return new RevokeSessionApplicationError(`User identified by ID ${userId} is disabled`, this.userDisabledId)
  }

  public static sessionNotFound(sessionId: string) {
    return new RevokeSessionApplicationError(`Session identified by ID ${sessionId} was not found`, this.sessionNotFoundId)
  }

  public static sessionDoesNotBelongToUser(sessionId: string, userId: string) {
    return new RevokeSessionApplicationError(
      `Session identified by ID ${sessionId} does not belong to user identified by ID ${userId}`,
      this.sessionDoesNotBelongToUserId,
    )
  }

  public static cannotRevokeSession(message: string) {
    return new RevokeSessionApplicationError(message, this.cannotRevokeSessionId)
  }
}
