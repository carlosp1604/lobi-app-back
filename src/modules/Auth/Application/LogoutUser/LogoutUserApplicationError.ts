export class LogoutUserApplicationError extends Error {
  public readonly __brand = 'LogoutUserApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidInputId = 'logout_user_invalid_input'
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

  public static invalidInput(field: string, errorMessage: string) {
    return new LogoutUserApplicationError(`Invalid input provided for field ${field}. Reason: ${errorMessage}`, this.invalidInputId)
  }

  public static userNotFound(userId: string) {
    return new LogoutUserApplicationError(`User identified by ID ${userId} was not found`, this.userNotFoundId)
  }

  public static userDisabled(userId: string) {
    return new LogoutUserApplicationError(`User identified by ID ${userId} is disabled`, this.userDisabledId)
  }

  public static sessionNotFound(sessionId: string) {
    return new LogoutUserApplicationError(`Session identified by ID ${sessionId} was not found`, this.sessionNotFoundId)
  }

  public static sessionDoesNotBelongToUser(sessionId: string, userId: string) {
    return new LogoutUserApplicationError(
      `Session identified by ID ${sessionId} does not belong to user identified by ID ${userId}`,
      this.sessionDoesNotBelongToUserId,
    )
  }

  public static cannotRevokeSession(message: string) {
    return new LogoutUserApplicationError(message, this.cannotRevokeSessionId)
  }
}
