import { Time } from '~/src/modules/Shared/Domain/ValueObject/Time'
import { TimeMother } from '~/src/test/mothers/Domain/Shared/TimeMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('Time', () => {
  describe('safeCreateFromString', () => {
    it('should return success when time string format is valid', () => {
      const validTimeValues = Array.from({ length: 100 }, () => TimeMother.randomValues())

      validTimeValues.forEach(({ formatted, seconds }) => {
        const result = Time.safeCreateFromString(formatted)

        expect(result.success).toBe(true)
        expect(result['value'].value).toBe(seconds)
      })
    })

    it.each(TimeMother.INVALID_FORMAT_CASES)('should return fail when format is invalid: %s', (invalidTime) => {
      const result = Time.safeCreateFromString(invalidTime)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidTime(invalidTime))
    })
  })

  describe('fromString', () => {
    it('should not throw when time string format is valid', () => {
      const validTimes = Array.from({ length: 100 }, () => TimeMother.randomValues())

      validTimes.forEach(({ formatted }) => {
        expect(() => Time.fromString(formatted)).not.toThrow()
      })
    })

    it.each(TimeMother.INVALID_FORMAT_CASES)('should throw error when format is invalid: %s', (invalidTime) => {
      expect(() => Time.fromString(invalidTime)).toThrow(SharedDomainException.invalidTime(invalidTime))
    })
  })

  describe('safeCreateFromSeconds', () => {
    it('should return success when seconds are valid', () => {
      const result = Time.safeCreateFromSeconds(TimeMother.VALID_SECONDS)

      expect(result.success).toBe(true)
      expect(result['value'].value).toBe(TimeMother.VALID_SECONDS)
    })

    it.each(TimeMother.INVALID_SECONDS)('should return fail when seconds are invalid: %s', (invalidSeconds) => {
      const result = Time.safeCreateFromSeconds(invalidSeconds)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidTime(String(invalidSeconds)))
    })
  })

  describe('fromSeconds', () => {
    it('should not throw when seconds are valid', () => {
      const validSecondsList = Array.from({ length: 100 }, () => TimeMother.randomSeconds())

      validSecondsList.forEach((validSeconds) => {
        expect(() => Time.fromSeconds(validSeconds)).not.toThrow()
      })
    })

    it.each(TimeMother.INVALID_SECONDS)('should throw error when seconds are invalid: %s', (invalidSeconds) => {
      expect(() => Time.fromSeconds(invalidSeconds)).toThrow(SharedDomainException.invalidTime(String(invalidSeconds)))
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure for HH:MM:SS format', () => {
      const validData = TimeMother.validValue()
      const time = Time.fromSeconds(validData.expectedSeconds)

      const dto = time.toDTO()

      expect(dto).toStrictEqual({
        seconds: validData.expectedSeconds,
        formatted: validData.formatted,
      })
    })

    it('should return correct DTO structure for MM:SS format (no hours padding)', () => {
      const validShortFormatData = TimeMother.validShortValue()
      const time = Time.fromSeconds(validShortFormatData.expectedSeconds)

      const dto = time.toDTO()

      expect(dto).toStrictEqual({
        seconds: validShortFormatData.expectedSeconds,
        formatted: validShortFormatData.formatted,
      })
    })
  })

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const validData = TimeMother.validValue()

      const time = Time.fromSeconds(validData.expectedSeconds)
      expect(time.toString()).toBe(validData.formatted)
    })
  })
})
