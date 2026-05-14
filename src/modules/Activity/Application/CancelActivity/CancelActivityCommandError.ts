export class CancelActivityCommandError extends Error {
  public readonly __brand = 'CancelActivityCommandError' as const

  public readonly id: string
  public readonly name: string

  public static readonly invalidUserIdId = 'cancel_activity_command_invalid_user_id'
  public static readonly invalidActivityIdId = 'cancel_activity_command_invalid_activity_id'
  public static readonly activityNotFoundId = 'cancel_activity_command_activity_not_found'
  public static readonly userNotFoundId = 'cancel_activity_command_user_not_found'
  public static readonly userDisabledId = 'cancel_activity_command_user_disabled'
  public static readonly onlyHostCanCancelActivityId = 'cancel_activity_command_only_host_can_cancel_activity'
  public static readonly activityStatusDoesNotAllowCancelId = 'cancel_activity_command_activity_does_not_allow_cancel'
  public static readonly activityCannotBeCancelledWithParticipantsId =
    'cancel_activity_command_activity_activity_cannot_be_cancelled_with_participants'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = CancelActivityCommandError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new CancelActivityCommandError(domainMessage, this.invalidUserIdId)
  }

  public static invalidActivityId(domainMessage: string) {
    return new CancelActivityCommandError(domainMessage, this.invalidActivityIdId)
  }

  public static activityNotFound() {
    return new CancelActivityCommandError('No activity was found for the provided identifier', this.activityNotFoundId)
  }

  public static userNotFound() {
    return new CancelActivityCommandError('No user was found for the provided identifier', this.userNotFoundId)
  }

  public static userDisabled() {
    return new CancelActivityCommandError('The user associated with this identifier is currently disabled', this.userDisabledId)
  }

  public static onlyHostCanCancelActivity(domainMessage: string) {
    return new CancelActivityCommandError(domainMessage, this.onlyHostCanCancelActivityId)
  }

  public static activityStatusDoesNotAllowCancel(domainMessage: string) {
    return new CancelActivityCommandError(domainMessage, this.activityStatusDoesNotAllowCancelId)
  }

  public static activityCannotBeCancelledWithParticipants(domainMessage: string) {
    return new CancelActivityCommandError(domainMessage, this.activityCannotBeCancelledWithParticipantsId)
  }
}
