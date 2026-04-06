import { PaceMother } from '~/src/test/mothers/Domain/Shared/PaceMother'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Pace, PaceProps, SupportedPaceUnits } from '~/src/modules/Shared/Domain/ValueObject/Pace'

class DummyVO extends ValueObject<PaceProps> {
  private constructor(value: PaceProps) {
    super(value)
  }

  static fromProps(props: PaceProps) {
    return new DummyVO(props)
  }
}

describe('Pace', () => {
  describe('safeCreateFromProps', () => {
    it('should return success when pace string and unit are valid', () => {
      const validPaceValues = Array.from({ length: 100 }, () => PaceMother.randomValues())

      validPaceValues.forEach((value) => {
        const result = Pace.safeCreateFromProps({ value: value.value, unit: value.unit })

        expect(result.success).toBe(true)
        expect(result['value'].value.unit).toBe('min/km')
      })
    })

    it.each(PaceMother.INVALID_FORMAT_CASES)('should return fail when format is invalid: %s', (invalidPace) => {
      const result = Pace.safeCreateFromProps({ value: invalidPace, unit: PaceMother.VALID_UNIT })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidPace(invalidPace))
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      const result = Pace.safeCreateFromProps({ value: PaceMother.VALID_STRING, unit: invalidUnit })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]))
    })

    it('should normalize to min/km correctly when', () => {
      const validMiData = PaceMother.validMiValue()
      const expectedStoredValues = PaceMother.validKmValue()

      const paceResult = Pace.safeCreateFromProps({ value: validMiData.value, unit: validMiData.unit })

      expect(paceResult.success).toBe(true)
      expect(paceResult['value'].value.value).toBe(expectedStoredValues.expectedSeconds)
      expect(paceResult['value'].value.unit).toBe(expectedStoredValues.unit)
    })
  })

  describe('fromProps', () => {
    it('should not throw error when pace string and unit are valid', () => {
      const validPaceValues = Array.from({ length: 100 }, () => PaceMother.randomValues())

      validPaceValues.forEach((value) => {
        expect(() => Pace.fromProps({ value: value.value, unit: value.unit })).not.toThrow()
      })
    })

    it.each(PaceMother.INVALID_FORMAT_CASES)('should throw error when format is invalid: %s', (invalidPace) => {
      expect(() => Pace.fromProps({ value: invalidPace, unit: 'min/km' })).toThrow(SharedDomainException.invalidPace(invalidPace))
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      expect(() => Pace.fromProps({ value: PaceMother.VALID_STRING, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]),
      )
    })
  })

  describe('safeCreateFromSeconds', () => {
    it('should return success when seconds and unit are valid', () => {
      const result = Pace.safeCreateFromSeconds(PaceMother.VALID_SECONDS, PaceMother.VALID_UNIT)

      expect(result.success).toBe(true)
      expect(result['value'].value.value).toBe(PaceMother.VALID_SECONDS)
      expect(result['value'].value.unit).toBe('min/km')
    })

    it.each(PaceMother.INVALID_SECONDS)('should return fail when seconds are invalid: %s', (invalidSeconds) => {
      const result = Pace.safeCreateFromSeconds(invalidSeconds, PaceMother.VALID_UNIT)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidPace(String(invalidSeconds)))
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      const result = Pace.safeCreateFromSeconds(PaceMother.VALID_SECONDS, invalidUnit)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]))
    })

    it('should normalize to min/km correctly when', () => {
      const validMiData = PaceMother.validMiValue()
      const expectedStoredValues = PaceMother.validKmValue()

      const paceResult = Pace.safeCreateFromSeconds(validMiData.expectedSeconds, validMiData.unit)

      expect(paceResult.success).toBe(true)
      expect(paceResult['value'].value.value).toBe(expectedStoredValues.expectedSeconds)
      expect(paceResult['value'].value.unit).toBe(expectedStoredValues.unit)
    })
  })

  describe('fromSeconds', () => {
    it('should not throw when seconds and unit are valid', () => {
      const validSeconds = Array.from({ length: 100 }, () => PaceMother.randomSeconds())

      validSeconds.forEach((validSeconds) => {
        expect(() => Pace.fromSeconds(validSeconds, PaceMother.VALID_UNIT)).not.toThrow()
      })
    })

    it.each(PaceMother.INVALID_SECONDS)('should throw error when seconds are invalid: %s', (invalidSeconds) => {
      expect(() => Pace.fromSeconds(invalidSeconds, PaceMother.VALID_UNIT)).toThrow(
        SharedDomainException.invalidPace(String(invalidSeconds)),
      )
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      expect(() => Pace.fromSeconds(PaceMother.VALID_SECONDS, invalidUnit)).toThrow(
        SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]),
      )
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const validKmData = PaceMother.validKmValue()
      const pace = Pace.fromProps({ value: validKmData.value, unit: validKmData.unit })

      const validMiData = PaceMother.validMiValue()

      const dto = pace.toDTO()

      expect(dto).toStrictEqual({
        value: validKmData.value,
        unit: validKmData.unit,
        seconds: validKmData.expectedSeconds,
        conversions: {
          'min/km': validKmData.value,
          'min/mi': validMiData.value,
        },
      })
    })
  })

  describe('toString', () => {
    it('should return formatted string with units', () => {
      const validKmData = PaceMother.validKmValue()

      const pace = Pace.fromSeconds(validKmData.expectedSeconds, validKmData.unit)
      expect(pace.toString()).toBe(`${validKmData.value} ${validKmData.unit}`)
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const validKmData = PaceMother.validKmValue()

      const valueA = DummyVO.fromProps({ value: validKmData.expectedSeconds, unit: validKmData.unit })
      const valueB = Pace.fromProps({ value: validKmData.value, unit: validKmData.unit })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(valueB.equals(valueA)).toBe(false)
    })

    it('should return true when both paces represent the same magnitude', () => {
      const validKmData = PaceMother.validKmValue()

      const pace1 = Pace.fromSeconds(validKmData.expectedSeconds, validKmData.unit)
      const pace2 = Pace.fromProps({ value: validKmData.value, unit: validKmData.unit })

      expect(pace1.equals(pace2)).toBe(true)
    })

    it('should return false when paces represent different magnitudes', () => {
      const validKmData = PaceMother.validKmValue()

      const pace1 = Pace.fromSeconds(validKmData.expectedSeconds, validKmData.unit)
      const pace2 = Pace.fromSeconds(validKmData.expectedSeconds + 1, validKmData.unit)

      expect(pace1.equals(pace2)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const pace = PaceMother.valid()

      expect(pace.equals(null)).toBe(false)
      expect(pace.equals(undefined)).toBe(false)
    })
  })
})
