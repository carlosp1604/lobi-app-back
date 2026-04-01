import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { TranslatableFieldMother } from '~/src/test/mothers/Domain/Shared/TranslatableFieldMother'
import { TranslatableField, ValidTranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'

describe('TranslatableField', () => {
  it.each(TranslatableFieldMother.VALID_TRANSLATABLE_FIELDS)(
    'should not throw when when translatable field is valid: %s',
    (validField) => {
      expect(() => TranslatableField.fromString(validField)).not.toThrow()
    },
  )

  it.each(TranslatableFieldMother.INVALID_FORMAT_CASES)('should throw ERROR when field is invalid: %s', (invalidValue) => {
    expect(() => TranslatableField.fromString(invalidValue)).toThrow(SharedDomainException.invalidTranslatableField())
  })

  describe('factories', () => {
    it('name factory should return the correct translatable field', () => {
      const translatableFieldValueObject = TranslatableFieldMother.name()

      expect(translatableFieldValueObject.value).toBe(ValidTranslatableField.NAME)
    })
  })

  it('should store the correct value', () => {
    const nameTranslatableFieldValueObject = TranslatableFieldMother.name()

    expect(nameTranslatableFieldValueObject.value).toBe(ValidTranslatableField.NAME)
  })
})
