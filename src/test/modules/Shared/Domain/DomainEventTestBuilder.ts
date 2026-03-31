import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type EventPayload = Record<string, JsonValue>
export type EventMetadata = Record<string, JsonValue>

export class DomainEventTestBuilder {
  private _id: Identifier = IdentifierMother.valid()
  private _name: DomainEventName = DomainEventName.successfulLogin()
  private _aggregateType: DomainEventAggregateType = DomainEventAggregateType.user()
  private _aggregateId: Identifier = IdentifierMother.valid()
  private _payload: EventPayload = {}
  private _metadata: EventMetadata = {}
  private _occurredAt: Date = new Date()

  withId(id: Identifier) {
    this._id = id
    return this
  }

  withName(name: DomainEventName) {
    this._name = name
    return this
  }

  withAggregateType(aggregateType: DomainEventAggregateType) {
    this._aggregateType = aggregateType
    return this
  }

  withAggregateId(aggregateId: Identifier) {
    this._aggregateId = aggregateId
    return this
  }

  withPayload(payload: EventPayload) {
    this._payload = payload
    return this
  }

  withMetadata(metadata: EventMetadata) {
    this._metadata = metadata
    return this
  }

  withOccurredAt(date: Date) {
    this._occurredAt = date
    return this
  }

  build(): DomainEvent {
    return DomainEvent.create(
      this._id,
      this._name,
      this._aggregateType,
      this._aggregateId,
      this._payload,
      this._metadata,
      this._occurredAt,
    )
  }
}
