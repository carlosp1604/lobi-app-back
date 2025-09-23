import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'

import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { DomainEventAggregateIdMother } from '~/src/test/mothers/DomainEventAggregateIdMother'

export type EventPayload = Record<string, unknown>
export type EventMetadata = Record<string, unknown>

export class DomainEventTestBuilder {
  private _id: DomainEventId = DomainEventIdMother.valid()
  private _name: DomainEventName = DomainEventName.successfulLogin()
  private _aggregateType: DomainEventAggregateType = DomainEventAggregateType.user()
  private _aggregateId: DomainEventAggregateId = DomainEventAggregateIdMother.valid()
  private _payload: EventPayload = {}
  private _metadata: EventMetadata = {}
  private _occurredAt: Date = new Date()

  withId(id: DomainEventId) {
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

  withAggregateId(aggregateId: DomainEventAggregateId) {
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
