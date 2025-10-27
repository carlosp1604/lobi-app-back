import fc from 'fast-check'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'

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

describe('DomainEventId', () => {
  it('should not throw error when domain event Id is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (domainEventId) => {
        expect(() => DomainEventId.fromString(domainEventId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when domain event Id is not valid: %s', (domainEventId) => {
    expect(() => DomainEventId.fromString(domainEventId)).toThrow(DomainEventDomainException.invalidDomainEventId(domainEventId))
  })

  it('should store the correct value', () => {
    const validValue = DomainEventIdMother.valid().toString()
    const domainEventIdValueObject = DomainEventId.fromString(validValue)

    expect(domainEventIdValueObject.value).toEqual(validValue)
  })
})
