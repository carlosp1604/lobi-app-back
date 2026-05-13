export class JoinActivityCommandError extends Error {
  public readonly __brand = 'JoinActivityCommandError' as const

  public readonly id: string
  public readonly name: string

  public static readonly invalidUserIdId = 'join_activity_command_invalid_user_id'
  public static readonly invalidActivityIdId = 'join_activity_command_invalid_activity_id'
  public static readonly activityNotFoundId = 'join_activity_command_activity_not_found'
  public static readonly userNotFoundId = 'join_activity_command_user_not_found'
  public static readonly userDisabledId = 'join_activity_command_user_disabled'
  public static readonly participantAlreadyJoinedId = 'join_activity_command_participant_already_joined'
  public static readonly activityDoesNotAllowJoinId = 'join_activity_command_activity_does_not_allow_join'
  public static readonly activityIsAlreadyFullId = 'join_activity_command_activity_is_already_full'
  public static readonly activityAlreadyStartedId = 'join_activity_command_activity_already_started'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = JoinActivityCommandError.name
  }

  public static invalidUserId(domainMessage: string) {
    return new JoinActivityCommandError(domainMessage, this.invalidUserIdId)
  }

  public static invalidActivityId(domainMessage: string) {
    return new JoinActivityCommandError(domainMessage, this.invalidActivityIdId)
  }

  public static activityNotFound() {
    return new JoinActivityCommandError('No activity was found for the provided identifier', this.activityNotFoundId)
  }

  public static userNotFound() {
    return new JoinActivityCommandError('No user was found for the provided identifier', this.userNotFoundId)
  }

  public static userDisabled() {
    return new JoinActivityCommandError('The user associated with this identifier is currently disabled', this.userDisabledId)
  }

  public static participantAlreadyJoined() {
    return new JoinActivityCommandError('User has already joined to activity', this.participantAlreadyJoinedId)
  }

  public static activityDoesNotAllowJoin(domainMessage: string) {
    return new JoinActivityCommandError(domainMessage, this.activityDoesNotAllowJoinId)
  }

  public static activityIsAlreadyFull(domainMessage: string) {
    return new JoinActivityCommandError(domainMessage, this.activityIsAlreadyFullId)
  }

  public static activityAlreadyStarted(domainMessage: string) {
    return new JoinActivityCommandError(domainMessage, this.activityAlreadyStartedId)
  }
}
