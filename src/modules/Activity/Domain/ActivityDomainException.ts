import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ActivityDomainException extends DomainException {
  public readonly __brand = 'ActivityDomainException' as const

  public static invalidActivityTitleId = 'activity_domain_invalid_activity_title'
  public static invalidActivityDescriptionId = 'activity_domain_invalid_activity_description'
  public static invalidActivityStatusId = 'activity_domain_invalid_activity_status'
  public static invalidActivityScheduledDateId = 'activity_domain_invalid_activity_scheduled_date'
  public static invalidSpecConfigurationId = 'activity_domain_invalid_spec_configuration'
  public static invalidCapabilityConfigurationId = 'activity_domain_invalid_capability_configuration'

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
}
