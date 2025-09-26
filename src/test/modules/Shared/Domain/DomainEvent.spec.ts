import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { DomainEventAggregateIdMother } from '~/src/test/mothers/DomainEventAggregateIdMother'
import { CurrentDomainEventVersion, DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'

describe('DomainEvent', () => {
  describe('create', () => {
    const now = new Date('2025-09-26T10:17:38Z')

    const id = DomainEventIdMother.valid()
    const aggregateId = DomainEventAggregateIdMother.valid()
    const aggregateType = DomainEventAggregateType.user()
    const name = DomainEventName.successfulLogin()

    it('should initialize the DomainEvent instance correctly', () => {
      const expectedPayload = {
        payloadProperty: 'expected-value',
      }

      const expectedMetadata = {
        payloadMetadata: 'expected-value',
      }

      const domainEvent = DomainEvent.create(id, name, aggregateType, aggregateId, expectedPayload, expectedMetadata, now)

      expect(domainEvent.id.equals(id)).toBe(true)
      expect(domainEvent.name.equals(name)).toBe(true)
      expect(domainEvent.aggregateType.equals(aggregateType)).toBe(true)
      expect(domainEvent.aggregateId.equals(aggregateId)).toBe(true)
      expect(domainEvent.payload).toBe(expectedPayload)
      expect(domainEvent.metadata).toBe(expectedMetadata)
      expect(domainEvent.version).toBe(CurrentDomainEventVersion)
      expect(domainEvent.occurredAt.getTime()).toBe(now.getTime())
    })
  })
})
