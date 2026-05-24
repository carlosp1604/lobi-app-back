export class GetUserSecurityDetailsQueryError extends Error {
  public readonly __brand = 'GetUserSecurityDetailsQueryError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'get_user_security_details_query_invalid_user_id'
  public static invalidSessionIdId = 'get_user_security_details_query_invalid_session_id'
  public static userNotFoundId = 'get_user_security_details_query_user_not_found'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GetUserSecurityDetailsQueryError.name
  }

  public static invalidUserId(domainError: string) {
    return new GetUserSecurityDetailsQueryError(domainError, this.invalidUserIdId)
  }

  public static invalidSessionId(domainError: string) {
    return new GetUserSecurityDetailsQueryError(domainError, this.invalidSessionIdId)
  }

  public static userNotFound() {
    return new GetUserSecurityDetailsQueryError('No user was found for the provided identifier', this.invalidSessionIdId)
  }
}
