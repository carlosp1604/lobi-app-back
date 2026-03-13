import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'
import { SportsmanProfileBirthDateMother } from '~/src/test/mothers/SportsmanProfileBirthDateMother'

describe('SportsmanProfileBirthDate', () => {
  const fixedNow = new Date('2026-02-14T16:20:00Z')

  describe('fromString', () => {
    const validDateStrings = Array.from({ length: 100 }, () => SportsmanProfileBirthDateMother.randomString(fixedNow))

    it.each(validDateStrings)('should not throw error when birth date string is valid: %s', (validDateString) => {
      expect(() => SportsmanProfileBirthDate.fromString(validDateString, fixedNow)).not.toThrow()
    })

    it.each(SportsmanProfileBirthDateMother.INVALID_STRING_FORMAT_CASES)(
      'should throw error when birth date string is not valid: %s',
      (invalidString) => {
        expect(() => SportsmanProfileBirthDate.fromString(invalidString, fixedNow)).toThrow(
          ProfileDomainException.invalidSportsmanBirthDate(new Date(invalidString)),
        )
      },
    )
  })

  describe('fromDate', () => {
    const validDates = Array.from({ length: 100 }, () => SportsmanProfileBirthDateMother.randomDate(fixedNow))

    it.each(validDates)('should not throw error when birth date object is valid: %s', (validDate) => {
      expect(() => SportsmanProfileBirthDate.fromDate(validDate, fixedNow)).not.toThrow()
    })

    it.each(SportsmanProfileBirthDateMother.INVALID_DATE_FORMAT_CASES)(
      'should throw error when birth date object is not valid: %s',
      (invalidDate) => {
        expect(() => SportsmanProfileBirthDate.fromDate(invalidDate, fixedNow)).toThrow(
          ProfileDomainException.invalidSportsmanBirthDate(invalidDate),
        )
      },
    )
  })

  describe('safeCreate', () => {
    const validDates = Array.from({ length: 100 }, () => SportsmanProfileBirthDateMother.randomDate(fixedNow))

    it.each(validDates)('should return success when birth date is valid: %s', (validDate) => {
      const result = SportsmanProfileBirthDate.safeCreate(validDate, fixedNow)
      expect(result.success).toBe(true)
    })

    it('should return error when birth date is in the future', () => {
      const futureDate = SportsmanProfileBirthDateMother.futureDate(fixedNow)
      const result = SportsmanProfileBirthDate.safeCreate(futureDate, fixedNow)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(ProfileDomainException.sportsmanBirthDateInFuture())
    })

    it('should return error when birth date is too old', () => {
      const tooOldDate = SportsmanProfileBirthDateMother.tooOldDate(fixedNow)
      const result = SportsmanProfileBirthDate.safeCreate(tooOldDate, fixedNow)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(ProfileDomainException.sportsmanBirthDateTooOld(SportsmanProfileBirthDate.MAX_AGE_YEARS))
    })

    it.each(SportsmanProfileBirthDateMother.INVALID_STRING_FORMAT_CASES)(
      'should return error when string format is invalid: %s',
      (invalidInput) => {
        const result = SportsmanProfileBirthDate.safeCreate(invalidInput, fixedNow)
        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(ProfileDomainException.invalidSportsmanBirthDate(new Date(invalidInput)))
      },
    )
  })

  describe('toISODate', () => {
    it('should format date correctly as YYYY-MM-DD ignoring time', () => {
      const dateWithTime = new Date(1990, 4, 15, 23, 59, 59)
      const sportsmanProfileBirthDateValueObject = SportsmanProfileBirthDate.fromDate(dateWithTime, fixedNow)

      expect(sportsmanProfileBirthDateValueObject.toISODate()).toBe('1990-05-15')
    })

    it('should pad single digit months and days with zero', () => {
      const dateWithSingleDigits = new Date(2005, 0, 5)
      const sportsmanProfileBirthDateValueObject = SportsmanProfileBirthDate.fromDate(dateWithSingleDigits, fixedNow)

      expect(sportsmanProfileBirthDateValueObject.toISODate()).toBe('2005-01-05')
    })
  })
})
