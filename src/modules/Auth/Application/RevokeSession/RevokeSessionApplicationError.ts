export class RevokeSessionApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidInputId = 'revoke_session_invalid_input'
  public static sessionNotFoundId = 'revoke_session_session_not_found'
  public static sessionDoesNotBelongToUserId = 'revoke_session_session_does_not_belong_to_user'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = RevokeSessionApplicationError.name
  }

  public static invalidInput() {
    return new RevokeSessionApplicationError('Identifiers format is not valid', this.invalidInputId)
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
}
