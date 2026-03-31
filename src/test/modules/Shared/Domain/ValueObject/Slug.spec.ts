import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { SlugMother } from '~/src/test/mothers/Domain/Shared/SlugMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('Slug', () => {
  describe('fromString', () => {
    it('should not throw error when slug is valid', () => {
      const validSlugs = Array.from({ length: 100 }, () => SlugMother.randomString())

      validSlugs.forEach((validSlug) => {
        expect(() => Slug.fromString(validSlug)).not.toThrow()
      })
    })

    it.each(SlugMother.INVALID_FORMAT_CASES)('should throw error when slug is not valid: %s', (invalidSlug) => {
      expect(() => Slug.fromString(invalidSlug)).toThrow(SharedDomainException.invalidSlug(invalidSlug))
    })
  })

  describe('safeCreate', () => {
    it('should return success when slug is valid', () => {
      const validSlugs = Array.from({ length: 100 }, () => SlugMother.randomString())

      validSlugs.forEach((validSlug) => {
        const result = Slug.safeCreate(validSlug)
        expect(result.success).toBe(true)
      })
    })

    it.each(SlugMother.INVALID_FORMAT_CASES)('should return error when slug is not valid: %s', (invalidSlug) => {
      const result = Slug.safeCreate(invalidSlug)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidSlug(invalidSlug))
    })
  })

  it('should store the correct value (normalized to lowercase and trimmed)', () => {
    const rawValue = '  A-Simple-SluG-10  '
    const expectedValue = 'a-simple-slug-10'

    const slugValueObject = Slug.fromString(rawValue)

    expect(slugValueObject.value).toBe(expectedValue)
  })
})
