import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateIdMother } from '~/src/test/mothers/DomainEventAggregateIdMother'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'
import { compareExceptModifiedFields } from '~/src/test/utils/snapshot'

interface DomainEventSnapshot {
  id: string
  name: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown>
  occurredAt: Date
  aggregateType: string
  aggregateId: string
  version: number
}

describe('DomainEventModelTranslator', () => {
  const isoDate = '2025-10-07T14:37:43Z'
  const now = new Date(isoDate)

  const createSnapshot = (domainEvent: DomainEvent): DomainEventSnapshot => {
    return {
      aggregateId: domainEvent.aggregateId.toString(),
      aggregateType: domainEvent.aggregateType.toString(),
      name: domainEvent.name.toString(),
      occurredAt: domainEvent.occurredAt,
      payload: domainEvent.payload,
      metadata: domainEvent.metadata,
      version: domainEvent.version,
      id: domainEvent.id.toString(),
    }
  }

  describe('toDatabase', () => {
    let domainEventBuilder = new DomainEventTestBuilder()

    beforeEach(() => {
      domainEventBuilder = new DomainEventTestBuilder()
        .withId(DomainEventIdMother.valid())
        .withName(DomainEventName.successfulLogin())
        .withPayload({})
        .withMetadata({ metaProperty: 'meta-value' })
        .withOccurredAt(now)
        .withAggregateId(DomainEventAggregateIdMother.valid())
        .withAggregateType(DomainEventAggregateType.user())
    })

    it('should return correct data', () => {
      const domainEvent = domainEventBuilder.build()

      const raw = DomainEventModelTranslator.toDatabase(domainEvent)

      expect(raw).toEqual({
        id: domainEvent.id.toString(),
        name: domainEvent.name.toString(),
        payload: domainEvent.payload,
        metadata: domainEvent.metadata,
        occurred_at: domainEvent.occurredAt,
        aggregate_type: domainEvent.aggregateType.toString(),
        aggregate_id: domainEvent.aggregateId.toString(),
        version: domainEvent.version,
      })
    })

    it('should not mutate input', () => {
      const domainEvent = domainEventBuilder.build()

      const beforeSnapshot = createSnapshot(domainEvent)

      DomainEventModelTranslator.toDatabase(domainEvent)

      const afterSnapshot = createSnapshot(domainEvent)

      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, [])
    })
  })
})
