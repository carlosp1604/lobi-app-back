import fc from 'fast-check'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IdentifierMother } from '~/src/test/mothers/IdentifierMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('Identifier', () => {
  describe('fromString', () => {
    it('should not throw error when identifier is valid', () => {
      fc.assert(
        fc.property(fc.uuid(), (validIdentifier) => {
          expect(() => Identifier.fromString(validIdentifier)).not.toThrow()
        }),
      )
    })

    it.each(IdentifierMother.INVALID_FORMAT_CASES)('should throw error when identifier is not valid: %s', (invalidIdentifier) => {
      expect(() => Identifier.fromString(invalidIdentifier)).toThrow(SharedDomainException.invalidIdentifier(invalidIdentifier))
    })
  })

  describe('safeCreate', () => {
    it('should return success when identifier is valid', () => {
      fc.assert(
        fc.property(fc.uuid(), (validIdentifier) => {
          const result = Identifier.safeCreate(validIdentifier)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(IdentifierMother.INVALID_FORMAT_CASES)('should return error when identifier is not valid: %s', (invalidIdentifier) => {
      const result = Identifier.safeCreate(invalidIdentifier)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(SharedDomainException.invalidIdentifier(invalidIdentifier))
    })
  })

  it('should store the correct value (normalized)', () => {
    const validValue = IdentifierMother.validString()
    const identifierValueObject = Identifier.fromString(validValue)

    expect(identifierValueObject.value).toEqual(validValue)
  })
})
