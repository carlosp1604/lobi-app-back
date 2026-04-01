import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { TranslatableTypeMother } from '~/src/test/mothers/Domain/Shared/TranslatableTypeMother'
import { TranslatableType, ValidTranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'

describe('TranslatableType', () => {
  it.each(TranslatableTypeMother.VALID_TRANSLATABLE_TYPES)('should not throw when when translatable type is valid: %s', (validType) => {
    expect(() => TranslatableType.fromString(validType)).not.toThrow()
  })

  it.each(TranslatableTypeMother.INVALID_FORMAT_CASES)('should throw error when type is invalid: %s', (invalidValue) => {
    expect(() => TranslatableType.fromString(invalidValue)).toThrow(SharedDomainException.invalidTranslatableType())
  })

  describe('factories', () => {
    it('sport factory should return the correct translatable type', () => {
      const translatableTypedValueObject = TranslatableTypeMother.sport()

      expect(translatableTypedValueObject.value).toBe(ValidTranslatableType.SPORT)
    })
  })

  it('should store the correct value', () => {
    const sportTranslatableTypeValueObject = TranslatableTypeMother.sport()

    expect(sportTranslatableTypeValueObject.value).toBe(ValidTranslatableType.SPORT)
  })
})
