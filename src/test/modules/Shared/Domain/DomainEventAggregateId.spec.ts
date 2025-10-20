import fc from 'fast-check'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateIdMother } from '~/src/test/mothers/DomainEventAggregateIdMother'

const invalidCases: Array<string> = [
  '',
  '123',
  'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
  '12345678-1234-1234-1234-1234567890',
  '123456781234123412341234567890ab',
  '12345678-1234-1234-1234-1234567890ab-',
  '-12345678-1234-1234-1234-1234567890ab',
  '12345678-1234-1234-1234-1234567890abc',
  '12345678_1234_1234_1234_1234567890ab',
  '12345678-1234-1234-1234-1234567890a',
  'g2345678-1234-1234-1234-1234567890ab',
]

describe('DomainEventAggregateId', () => {
  it('should not throw error when domain event aggregate Id is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (domainEventAggregateId) => {
        expect(() => DomainEventAggregateId.fromString(domainEventAggregateId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when domain event aggregate Id is not valid: %s', (domainEventAggregateId) => {
    expect(() => DomainEventAggregateId.fromString(domainEventAggregateId)).toThrow(
      DomainEventDomainException.invalidDomainEventAggregateId(domainEventAggregateId),
    )
  })

  it('should store the correct value', () => {
    const validValue = DomainEventAggregateIdMother.valid().toString()
    const domainEventAggregateIdValueObject = DomainEventAggregateId.fromString(validValue)

    expect(domainEventAggregateIdValueObject.value).toEqual(validValue)
  })
})
