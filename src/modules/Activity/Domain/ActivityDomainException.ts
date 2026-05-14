import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ActivityStatus, ValidActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'
import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ActivityDomainException extends DomainException {
  public readonly __brand = 'ActivityDomainException' as const

  public static readonly invalidActivityTitleId = 'activity_domain_invalid_activity_title'
  public static readonly invalidActivityDescriptionId = 'activity_domain_invalid_activity_description'
  public static readonly invalidActivityStatusId = 'activity_domain_invalid_activity_status'
  public static readonly invalidActivityScheduledDateId = 'activity_domain_invalid_activity_scheduled_date'
  public static readonly invalidSpecConfigurationId = 'activity_domain_invalid_spec_configuration'
  public static readonly invalidCapabilityConfigurationId = 'activity_domain_invalid_capability_configuration'
  public static readonly activityDoesNotAllowJoinId = 'activity_domain_activity_does_not_allow_join'
  public static readonly activityAlreadyStartedId = 'activity_domain_activity_already_started'
  public static readonly activityIsAlreadyFullId = 'activity_domain_activity_is_already_full'
  public static readonly activityDoesNotAllowLeaveId = 'activity_domain_activity_does_not_allow_leave'
  public static readonly activityLeaveMarginDoesNotMeetId = 'activity_domain_activity_leave_margin_does_not_meet'
  public static readonly activityConfirmedToTakePlaceId = 'activity_domain_activity_confirmed_to_take_place'
  public static readonly cannotReplaceHostWithCurrentHostId = 'activity_domain_cannot_replace_host_with_current_host'
  public static readonly hostCannotLeaveActivityId = 'activity_domain_activity_host_cannot_leave_activity'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, ActivityDomainException.name, context)
  }

  public static invalidActivityTitle(title: string, min: number, max: number) {
    const safeTitleSample = StringFormatter.formatSafe(title, 60)
    return new ActivityDomainException(
      `Activity title must be a string with a length between ${min} and ${max}. Any character is allowed`,
      this.invalidActivityTitleId,
      { title: safeTitleSample, min, max },
    )
  }

  public static invalidActivityDescription(description: string, min: number, max: number) {
    const safeDescriptionSample = StringFormatter.formatSafe(description, 60)
    return new ActivityDomainException(
      `Activity description must be a string with a length between ${min} and ${max}. Any character is allowed`,
      this.invalidActivityDescriptionId,
      { description: safeDescriptionSample, min, max },
    )
  }

  public static invalidActivityStatus(current: string, supportedStatuses: Array<string>) {
    const safeStatusSample = StringFormatter.formatSafe(current, 20)
    const supported = supportedStatuses.join(', ')

    return new ActivityDomainException(
      `Invalid activity status. Supported statuses are: [${supported}]`,
      this.invalidActivityStatusId,
      { status: safeStatusSample, supported },
    )
  }

  public static invalidActivityScheduledDate() {
    return new ActivityDomainException('Activity scheduled date must be a valid date', this.invalidActivityScheduledDateId)
  }

  public static scheduledDateOutOfRange(current: string, minMinutes: number, maxDays: number) {
    return new ActivityDomainException(
      `An activity must be scheduled at least ${minMinutes} minutes in advance and no more than ${maxDays} days into the future`,
      this.invalidActivityScheduledDateId,
      { current, minMinutes, maxDays },
    )
  }

  public static invalidSpecConfiguration(specName: string, reason: string) {
    return new ActivityDomainException(reason, this.invalidSpecConfigurationId, {
      specName,
    })
  }

  public static invalidCapabilityConfiguration(capabilityName: string, reason: string) {
    return new ActivityDomainException(reason, this.invalidCapabilityConfigurationId, {
      capabilityName,
    })
  }

  public static activityDoesNotAllowJoin(
    activityId: Identifier,
    currentStatus: ActivityStatus,
    allowedStatuses: Array<ValidActivityStatus>,
  ): ActivityDomainException {
    return new ActivityDomainException(
      `Cannot join the activity. Current status is '${currentStatus.value}', but allowed statuses are: [${allowedStatuses.join(', ')}]`,
      this.activityDoesNotAllowJoinId,
      { activityId: activityId.value, currentStatus: currentStatus.value, allowedStatuses },
    )
  }

  public static activityAlreadyStarted(activityId: Identifier, scheduledAt: ActivityScheduledDate, now: Date): ActivityDomainException {
    return new ActivityDomainException(
      'Cannot join the activity because it has already started or the join time has expired',
      this.activityAlreadyStartedId,
      {
        activityId: activityId.value,
        scheduledAt: scheduledAt.value.toISOString(),
        now: now.toISOString(),
      },
    )
  }

  public static activityIsAlreadyFull(
    activityId: Identifier,
    currentParticipants: IntegerNumber,
    maxCapacity: IntegerNumber,
  ): ActivityDomainException {
    return new ActivityDomainException(
      'Cannot join the activity because it has reached its maximum capacity',
      this.activityIsAlreadyFullId,
      {
        activityId: activityId.value,
        currentParticipants: currentParticipants.value,
        maxCapacity: maxCapacity.value,
      },
    )
  }

  public static activityDoesNotAllowLeave(
    activityId: Identifier,
    currentStatus: ActivityStatus,
    allowedStatuses: Array<ValidActivityStatus>,
  ): ActivityDomainException {
    return new ActivityDomainException(
      `Cannot leave the activity. Current status is '${currentStatus.value}', but allowed statuses are: [${allowedStatuses.join(', ')}]`,
      this.activityDoesNotAllowLeaveId,
      { activityId: activityId.value, currentStatus: currentStatus.value, allowedStatuses },
    )
  }

  public static activityLeaveMarginDoesNotMeet(
    activityId: Identifier,
    scheduledAt: ActivityScheduledDate,
    marginMinutes: number,
    now: Date,
  ): ActivityDomainException {
    return new ActivityDomainException(
      `Cannot leave the activity. The remaining time before the start time is less than the allowed margin of ${marginMinutes} minutes`,
      this.activityLeaveMarginDoesNotMeetId,
      { activityId: activityId.value, scheduledAt: scheduledAt.value.toISOString(), now: now.toISOString() },
    )
  }

  public static activityConfirmedToTakePlace(
    activityId: Identifier,
    currentParticipants: IntegerNumber,
    minCapacity: IntegerNumber,
  ): ActivityDomainException {
    return new ActivityDomainException(
      `Cannot leave the activity. The minimum capacity (${minCapacity.value}) has been reached and the event is confirmed to take place`,
      this.activityConfirmedToTakePlaceId,
      {
        activityId: activityId.value,
        currentParticipants: currentParticipants.value,
        minCapacity: minCapacity.value,
      },
    )
  }

  public static cannotReplaceHostWithCurrentHost(activityId: Identifier, hostId: Identifier): ActivityDomainException {
    return new ActivityDomainException(
      'Cannot replace the activity host. The provided candidate is already the active host of this activity',
      this.cannotReplaceHostWithCurrentHostId,
      {
        activityId: activityId.value,
        hostId: hostId.value,
      },
    )
  }

  public static hostCannotLeaveActivity(activityId: Identifier, hostId: Identifier): ActivityDomainException {
    return new ActivityDomainException(
      'The current host of an activity cannot leave because activity has participants',
      this.hostCannotLeaveActivityId,
      {
        activityId: activityId.value,
        hostId: hostId.value,
      },
    )
  }
}
