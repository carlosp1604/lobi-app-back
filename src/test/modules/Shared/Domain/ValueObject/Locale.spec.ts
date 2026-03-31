import { LocaleMother } from '~/src/test/mothers/Domain/Shared/LocaleMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Locale, SUPPORTED_LOCALES } from '~/src/modules/Shared/Domain/ValueObject/Locale'

describe('Locale', () => {
  describe('fromString', () => {
    it('should not throw error when locale is supported', () => {
      SUPPORTED_LOCALES.forEach((validLocale) => {
        expect(() => Locale.fromString(validLocale)).not.toThrow()
      })
    })

    it.each(LocaleMother.INVALID_FORMAT_CASES)('should throw error when locale is not supported: %s', (invalidLocale) => {
      expect(() => Locale.fromString(invalidLocale)).toThrow(SharedDomainException.invalidLocale())
    })
  })

  describe('safeCreate', () => {
    it('should return success when locale is supported', () => {
      const validValue = LocaleMother.randomString()
      const result = Locale.safeCreate(validValue)

      expect(result.success).toBe(true)
    })

    it.each(LocaleMother.INVALID_FORMAT_CASES)('should throw error when locale is not supported: %s', (invalidLocale) => {
      const result = Locale.safeCreate(invalidLocale)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidLocale())
    })
  })

  it('should store the correct value (normalized to lowercase and trimmed)', () => {
    const rawValue = `  ${LocaleMother.default().toLocaleUpperCase()}  `
    const localeValueObject = Locale.fromString(rawValue)

    expect(localeValueObject.value).toBe(LocaleMother.default())
  })
})
