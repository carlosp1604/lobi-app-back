import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type EventPayload = Record<string, JsonValue>
export type EventMetadata = Record<string, JsonValue>

export const CurrentDomainEventVersion = 1

export class DomainEvent {
  private constructor(
    public readonly id: Identifier,
    public readonly name: DomainEventName,
    public readonly aggregateType: DomainEventAggregateType,
    public readonly aggregateId: Identifier,
    public readonly payload: EventPayload,
    public readonly metadata: EventMetadata,
    public readonly version: number,
    public readonly occurredAt: Date,
  ) {}

  static create(
    id: Identifier,
    name: DomainEventName,
    aggregateType: DomainEventAggregateType,
    aggregateId: Identifier,
    payload: EventPayload,
    metadata: EventMetadata,
    now: Date,
  ) {
    return new DomainEvent(id, name, aggregateType, aggregateId, payload, metadata, CurrentDomainEventVersion, now)
  }
}
