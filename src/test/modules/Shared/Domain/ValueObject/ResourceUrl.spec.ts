import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { ResourceUrlMother } from '~/src/test/mothers/Domain/Shared/ResourceUrlMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('ResourceUrl', () => {
  describe('fromString', () => {
    it('should not throw error when resource url is valid', () => {
      const validUrls = Array.from({ length: 100 }, () => ResourceUrlMother.randomString())

      validUrls.forEach((validUrl) => {
        expect(() => ResourceUrl.fromString(validUrl)).not.toThrow()
      })
    })

    it.each(ResourceUrlMother.INVALID_FORMAT_CASES)('should throw error when resource url is not valid: %s', (invalidUrl) => {
      expect(() => ResourceUrl.fromString(invalidUrl)).toThrow(SharedDomainException.invalidResourceUrl(invalidUrl))
    })
  })

  describe('safeCreate', () => {
    it('should return success when resource url is valid', () => {
      const validUrls = Array.from({ length: 100 }, () => ResourceUrlMother.randomString())

      validUrls.forEach((validUrl) => {
        const result = ResourceUrl.safeCreate(validUrl)
        expect(result.success).toBe(true)
      })
    })

    it.each(ResourceUrlMother.INVALID_FORMAT_CASES)('should return error when resource url is not valid: %s', (invalidUrl) => {
      const result = ResourceUrl.safeCreate(invalidUrl)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidResourceUrl(invalidUrl))
    })
  })

  it('should store the correct value (trimmed but preserving case)', () => {
    const rawValue = `  ${ResourceUrlMother.validString()}  `

    const urlValueObject = ResourceUrl.fromString(rawValue)

    expect(urlValueObject.value).toBe(ResourceUrlMother.validString())
  })
})
