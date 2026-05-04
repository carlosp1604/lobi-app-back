export class GetActivityApplicationError extends Error {
  public readonly __brand = 'GetActivityApplicationError' as const

  public readonly id: string
  public readonly name: string

  public static invalidUserIdId = 'get_activity_application_invalid_user_id'
  public static invalidActivityIdId = 'get_activity_application_invalid_activity_id'
  public static activityNotFoundId = 'get_activity_application_activity_not_found'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = GetActivityApplicationError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new GetActivityApplicationError(domainMessage, this.invalidUserIdId)
  }

  public static invalidActivityId(domainMessage: string) {
    return new GetActivityApplicationError(domainMessage, this.invalidActivityIdId)
  }

  public static activityNotFound() {
    return new GetActivityApplicationError('No activity was found for the provided identifier', this.activityNotFoundId)
  }
}
