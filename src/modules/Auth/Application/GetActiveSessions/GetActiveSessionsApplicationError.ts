export class GetActiveSessionsApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static invalidInputId = 'get_active_sessions_invalid_input'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GetActiveSessionsApplicationError.name
  }

  public static invalidInput(field: string, errorMessage: string) {
    return new GetActiveSessionsApplicationError(
      `Invalid input provided for field ${field}. Reason: ${errorMessage}`,
      this.invalidInputId,
    )
  }
}
