export class LeaveActivityCommandError extends Error {
  public readonly __brand = 'LeaveActivityCommandError' as const

  public readonly id: string
  public readonly name: string

  public static readonly invalidUserIdId = 'leave_activity_command_invalid_user_id'
  public static readonly invalidActivityIdId = 'leave_activity_command_invalid_activity_id'
  public static readonly activityNotFoundId = 'leave_activity_command_activity_not_found'
  public static readonly userNotFoundId = 'leave_activity_command_user_not_found'
  public static readonly userDisabledId = 'leave_activity_command_user_disabled'
  public static readonly userIsNotAParticipantId = 'leave_activity_command_user_is_not_a_participant'
  public static readonly activityStatusDoesNotAllowLeaveId = 'leave_activity_command_activity_does_not_allow_leave'
  public static readonly activityLeaveDeadlineAlreadyPassedId = 'leave_activity_command_activity_leave_deadline_already_passed'
  public static readonly activityAlreadyConfirmedToTakePlaceId = 'leave_activity_command_activity_already_confirmed_to_take_place'
  public static readonly activityInconsistentStateId = 'leave_activity_command_activity_activity_inconsistent_state'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = LeaveActivityCommandError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new LeaveActivityCommandError(domainMessage, this.invalidUserIdId)
  }

  public static invalidActivityId(domainMessage: string) {
    return new LeaveActivityCommandError(domainMessage, this.invalidActivityIdId)
  }

  public static activityNotFound() {
    return new LeaveActivityCommandError('No activity was found for the provided identifier', this.activityNotFoundId)
  }

  public static userNotFound() {
    return new LeaveActivityCommandError('No user was found for the provided identifier', this.userNotFoundId)
  }

  public static userDisabled() {
    return new LeaveActivityCommandError('The user associated with this identifier is currently disabled', this.userDisabledId)
  }

  public static userIsNotAParticipant() {
    return new LeaveActivityCommandError('User is not participating in this activity', this.userIsNotAParticipantId)
  }

  public static activityStatusDoesNotAllowLeave(domainMessage: string) {
    return new LeaveActivityCommandError(domainMessage, this.activityStatusDoesNotAllowLeaveId)
  }

  public static activityLeaveDeadlineAlreadyPassed(domainMessage: string) {
    return new LeaveActivityCommandError(domainMessage, this.activityLeaveDeadlineAlreadyPassedId)
  }

  public static activityAlreadyConfirmedToTakePlace(domainMessage: string) {
    return new LeaveActivityCommandError(domainMessage, this.activityAlreadyConfirmedToTakePlaceId)
  }

  public static activityInconsistentState() {
    return new LeaveActivityCommandError(
      'Cannot perform the operation. The activity is in an inconsistent state',
      this.activityInconsistentStateId,
    )
  }
}
