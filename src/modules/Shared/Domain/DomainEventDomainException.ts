import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class DomainEventDomainException extends DomainException {
  public readonly __brand = 'DomainEventDomainException' as const

  public static invalidDomainEventNameId = 'domain_event_domain_invalid_domain_event_name'
  public static invalidDomainEventAggregateTypeId = 'domain_event_domain_invalid_domain_event_aggregate_type'

  private constructor(message: string, id: string) {
    super(message, id, DomainEventDomainException.name)
  }

  public static invalidDomainEventName(eventName: string) {
    return new DomainEventDomainException(`${eventName} is not a valid DomainEvent name`, this.invalidDomainEventNameId)
  }

  public static invalidDomainEventAggregateType(eventType: string) {
    return new DomainEventDomainException(
      `${eventType} is not a valid DomainEvent aggregate type`,
      this.invalidDomainEventAggregateTypeId,
    )
  }
}
