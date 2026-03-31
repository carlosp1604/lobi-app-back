import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'

describe('DomainEventModelTranslator', () => {
  const isoDate = '2025-10-07T14:37:43Z'
  const now = new Date(isoDate)

  describe('toDatabase', () => {
    let domainEventBuilder: DomainEventTestBuilder

    const checkDatabaseResult = (result: DomainEventRawModel, domain: DomainEvent) => {
      expect(result.id).toBe(domain.id.toString())
      expect(result.name).toBe(domain.name.toString())
      expect(result.payload).toEqual(domain.payload)
      expect(result.metadata).toEqual(domain.metadata)
      expect(result.occurred_at).toEqual(domain.occurredAt)
      expect(result.aggregate_type).toBe(domain.aggregateType.toString())
      expect(result.aggregate_id).toBe(domain.aggregateId.toString())
      expect(result.version).toBe(domain.version)
    }

    beforeEach(() => {
      domainEventBuilder = new DomainEventTestBuilder()
        .withId(IdentifierMother.valid())
        .withName(DomainEventName.successfulLogin())
        .withPayload({ userId: 'test-user-id', sessionId: 'test-session-id' })
        .withMetadata({ ipHash: 'test-hash-ip', ua: 'test-user-agent' })
        .withOccurredAt(now)
        .withAggregateId(IdentifierMother.valid())
        .withAggregateType(DomainEventAggregateType.user())
    })

    it('should return the correct raw model data', () => {
      const domainEvent = domainEventBuilder.build()

      const result = DomainEventModelTranslator.toDatabase(domainEvent)

      checkDatabaseResult(result, domainEvent)
    })

    it('should handle empty payload and metadata correctly', () => {
      const domainEvent = domainEventBuilder.withPayload({}).withMetadata({}).build()

      const result = DomainEventModelTranslator.toDatabase(domainEvent)

      checkDatabaseResult(result, domainEvent)
      expect(result.payload).toEqual({})
      expect(result.metadata).toEqual({})
    })

    it('does not mutate the input domain object', () => {
      const domainEvent = domainEventBuilder.build()

      const snapshot = {
        id: domainEvent.id.toString(),
        name: domainEvent.name.toString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload: JSON.parse(JSON.stringify(domainEvent.payload)),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: JSON.parse(JSON.stringify(domainEvent.metadata)),
        occurredAt: domainEvent.occurredAt,
        aggregateType: domainEvent.aggregateType.toString(),
        aggregateId: domainEvent.aggregateId.toString(),
        version: domainEvent.version,
      }

      DomainEventModelTranslator.toDatabase(domainEvent)

      expect(domainEvent.id.toString()).toBe(snapshot.id)
      expect(domainEvent.name.toString()).toBe(snapshot.name)
      expect(domainEvent.payload).toEqual(snapshot.payload)
      expect(domainEvent.metadata).toEqual(snapshot.metadata)
      expect(domainEvent.occurredAt).toEqual(snapshot.occurredAt)
      expect(domainEvent.aggregateType.toString()).toBe(snapshot.aggregateType)
      expect(domainEvent.aggregateId.toString()).toBe(snapshot.aggregateId)
      expect(domainEvent.version).toBe(snapshot.version)
    })
  })
})
