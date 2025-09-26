import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'

export type EventPayload = Record<string, unknown>
export type EventMetadata = Record<string, unknown>

export const CurrentDomainEventVersion = 1

export class DomainEvent {
  private constructor(
    public readonly id: DomainEventId,
    public readonly name: DomainEventName,
    public readonly aggregateType: DomainEventAggregateType,
    public readonly aggregateId: DomainEventAggregateId,
    public readonly payload: EventPayload,
    public readonly metadata: EventMetadata,
    public readonly version: number,
    public readonly occurredAt: Date,
  ) {}

  static create(
    id: DomainEventId,
    name: DomainEventName,
    aggregateType: DomainEventAggregateType,
    aggregateId: DomainEventAggregateId,
    payload: EventPayload,
    metadata: EventMetadata,
    now: Date,
  ) {
    return new DomainEvent(id, name, aggregateType, aggregateId, payload, metadata, CurrentDomainEventVersion, now)
  }
}
