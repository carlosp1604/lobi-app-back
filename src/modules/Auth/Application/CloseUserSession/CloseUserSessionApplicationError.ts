export class CloseUserSessionApplicationError extends Error {
  public readonly __brand = 'CloseUserSessionApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidInputId = 'close_user_session_invalid_input'
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

  public static invalidInput(field: string, errorMessage: string) {
    return new CloseUserSessionApplicationError(
      `Invalid input provided for field ${field}. Reason: ${errorMessage}`,
      this.invalidInputId,
    )
  }

  public static userNotFound(userId: string) {
    return new CloseUserSessionApplicationError(`User identified by ID ${userId} was not found`, this.userNotFoundId)
  }

  public static userDisabled(userId: string) {
    return new CloseUserSessionApplicationError(`User identified by ID ${userId} is disabled`, this.userDisabledId)
  }

  public static sessionNotFound(sessionId: string) {
    return new CloseUserSessionApplicationError(`Session identified by ID ${sessionId} was not found`, this.sessionNotFoundId)
  }

  public static sessionDoesNotBelongToUser(sessionId: string, userId: string) {
    return new CloseUserSessionApplicationError(
      `Session identified by ID ${sessionId} does not belong to user identified by ID ${userId}`,
      this.sessionDoesNotBelongToUserId,
    )
  }

  public static cannotRevokeSession(message: string) {
    return new CloseUserSessionApplicationError(message, this.cannotRevokeSessionId)
  }
}
