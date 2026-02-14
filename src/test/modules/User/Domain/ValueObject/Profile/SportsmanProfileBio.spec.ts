import { SportsmanProfileBioMother } from '~/src/test/mothers/SportsmanProfileBioMother'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'

describe('SportsmanProfileBio', () => {
  describe('fromString', () => {
    const validBios = Array.from({ length: 100 }, () => SportsmanProfileBioMother.randomString())

    it.each(validBios)('should not throw error when sportsman profile bio is valid: %s', (validBio) => {
      expect(() => SportsmanProfileBio.fromString(validBio)).not.toThrow()
    })

    it.each(SportsmanProfileBioMother.INVALID_FORMAT_CASES)('should throw error when sportsman profile bio is not valid: %s', (bio) => {
      expect(() => SportsmanProfileBio.fromString(bio)).toThrow(ProfileDomainException.invalidSportsmanBio(bio))
    })
  })

  describe('safeCreate', () => {
    const validBios = Array.from({ length: 100 }, () => SportsmanProfileBioMother.randomString())

    it.each(validBios)('should not throw error when sportsman profile bio is valid: %s', (validBio) => {
      const result = SportsmanProfileBio.safeCreate(validBio)

      expect(result.success).toBe(true)
    })

    it.each(SportsmanProfileBioMother.INVALID_FORMAT_CASES)('should throw error when sportsman profile bio is not valid: %s', (bio) => {
      const result = SportsmanProfileBio.safeCreate(bio)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(ProfileDomainException.invalidSportsmanBio(bio))
    })
  })

  it('should store the correct value normalized (trimmed)', () => {
    const rawValue = '  ' + SportsmanProfileBioMother.valid().value + '  '
    const bioValueObject = SportsmanProfileBio.fromString(rawValue)

    expect(bioValueObject.value).toEqual(rawValue.trim())
  })
})
