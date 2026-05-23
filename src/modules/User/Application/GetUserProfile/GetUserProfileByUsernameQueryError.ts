export class GetUserProfileByUsernameQueryError extends Error {
  public readonly __brand = 'GetUserProfileByUsernameApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUsernameId = 'get_user_profile_by_username_query_invalid_username'
  public static userNotFoundId = 'get_user_profile_by_username_query_user_not_found'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GetUserProfileByUsernameQueryError.name
  }

  public static invalidUsername(domainError: string) {
    return new GetUserProfileByUsernameQueryError(domainError, this.invalidUsernameId)
  }

  public static userNotFound() {
    return new GetUserProfileByUsernameQueryError('No user was found for the provided username', this.userNotFoundId)
  }
}
