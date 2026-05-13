export class GetActivityQueryError extends Error {
  public readonly __brand = 'GetActivityQueryError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'get_activity_query_invalid_user_id'
  public static invalidActivityIdId = 'get_activity_query_invalid_activity_id'
  public static activityNotFoundId = 'get_activity_query_activity_not_found'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GetActivityQueryError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new GetActivityQueryError(domainMessage, this.invalidUserIdId)
  }

  public static invalidActivityId(domainMessage: string) {
    return new GetActivityQueryError(domainMessage, this.invalidActivityIdId)
  }

  public static activityNotFound() {
    return new GetActivityQueryError('No activity was found for the provided identifier', this.activityNotFoundId)
  }
}
