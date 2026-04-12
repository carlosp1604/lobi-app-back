import { PaceMother } from '~/src/test/mothers/Domain/Shared/PaceMother'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Pace, PaceProps, SupportedPaceUnits } from '~/src/modules/Shared/Domain/ValueObject/Pace'
import { NumericValue } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'

class DummyVO extends ValueObject<PaceProps> {}

describe('Pace', () => {
  describe('safeCreate', () => {
    it('should return success when seconds and unit are valid', () => {
      const validSeconds = Array.from({ length: 100 }, () => PaceMother.randomSeconds())

      validSeconds.forEach((seconds) => {
        const result = Pace.safeCreate({ value: seconds, unit: Pace.DEFAULT_UNIT })

        expect(result.success).toBe(true)
        if (result.success) {
          const pace = result.value
          expect(pace.value.value.numericValue).toBe(seconds)
          expect(pace.value.unit).toBe(Pace.DEFAULT_UNIT)
        }
      })
    })

    it.each(PaceMother.INVALID_SECONDS)('should return fail when seconds are invalid: %s', (invalidSeconds) => {
      const result = Pace.safeCreate({ value: invalidSeconds, unit: Pace.DEFAULT_UNIT })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toStrictEqual(SharedDomainException.invalidPace(String(invalidSeconds)))
      }
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is not supported: %s', (invalidUnit) => {
      const result = Pace.safeCreate({ value: PaceMother.VALID_MIN_KM_SECONDS, unit: invalidUnit })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toStrictEqual(SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]))
      }
    })

    it('should normalize to min/km correctly when input is min/mi', () => {
      const validMinMiData = PaceMother.validMinMiValue()

      const paceResult = Pace.safeCreate({ value: validMinMiData.value, unit: validMinMiData.unit })

      expect(paceResult.success).toBe(true)
      if (paceResult.success) {
        const pace = paceResult.value

        expect(pace.value.value.equals(NumericValue.fromValue(validMinMiData.value))).toBe(true)
        expect(pace.value.unit).toBe('min/mi')
        expect(pace.value.normalizedValue.equals(NumericValue.fromValue(validMinMiData.conversions['min/km'].long))).toBe(true)
      }
    })

    it('should normalize to min/km correctly when input is min/km', () => {
      const validMinKmData = PaceMother.validMinKmValue()

      const paceResult = Pace.safeCreate({ value: validMinKmData.value, unit: validMinKmData.unit })

      expect(paceResult.success).toBe(true)
      if (paceResult.success) {
        const pace = paceResult.value

        expect(pace.value.value.equals(NumericValue.fromValue(validMinKmData.value))).toBe(true)
        expect(pace.value.unit).toBe('min/km')
        expect(pace.value.normalizedValue.equals(pace.value.value)).toBe(true)
      }
    })
  })

  describe('fromProps', () => {
    it('should not throw error when seconds and unit are valid', () => {
      const validSeconds = Array.from({ length: 100 }, () => PaceMother.randomSeconds())

      validSeconds.forEach((seconds) => {
        expect(() => Pace.fromProps({ value: seconds, unit: Pace.DEFAULT_UNIT })).not.toThrow()
      })
    })

    it.each(PaceMother.INVALID_SECONDS)('should return fail when seconds are invalid: %s', (invalidSeconds) => {
      expect(() => Pace.fromProps({ value: invalidSeconds, unit: Pace.DEFAULT_UNIT })).toThrow(
        SharedDomainException.invalidPace(String(invalidSeconds)),
      )
    })

    it.each(PaceMother.INVALID_UNITS)('should return fail when unit is not supported: %s', (invalidUnit) => {
      expect(() => Pace.fromProps({ value: PaceMother.VALID_MIN_KM_SECONDS, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Pace', invalidUnit, [...SupportedPaceUnits]),
      )
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const validMinMiData = PaceMother.validMinMiValue()

      const pace = Pace.fromProps({ value: validMinMiData.value, unit: validMinMiData.unit })

      const dto = pace.toDTO()

      expect(dto).toEqual({
        value: validMinMiData.conversions['min/km'].long,
        unit: 'min/km',
        conversions: {
          'min/km': validMinMiData.conversions['min/km'].short,
          'min/mi': validMinMiData.conversions['min/mi'].short,
        },
        formatted: {
          'min/km': {
            short: validMinMiData.formatted['min/km'].short,
            long: validMinMiData.formatted['min/km'].long,
          },
          'min/mi': {
            short: validMinMiData.formatted['min/mi'].short,
            long: validMinMiData.formatted['min/mi'].long,
          },
        },
      })
    })
  })

  describe('equals', () => {
    it('should return true when both paces represent same magnitude', () => {
      const paceKm = Pace.fromProps({ value: 1, unit: 'min/km' })
      const paceMi = Pace.fromProps({ value: Pace.KM_TO_MI_FACTOR.numericValue, unit: 'min/mi' })

      expect(paceKm.equals(paceMi)).toBe(true)
    })

    it('should return false when paces represent different magnitudes', () => {
      const pace1 = Pace.fromProps({ value: PaceMother.VALID_MIN_KM_SECONDS, unit: 'min/km' })
      const pace2 = Pace.fromProps({ value: PaceMother.VALID_MIN_KM_SECONDS + 1, unit: 'min/km' })

      expect(pace1.equals(pace2)).toBe(false)
    })

    it('should return false when types are different', () => {
      const pace = Pace.fromProps({ value: PaceMother.VALID_MIN_KM_SECONDS, unit: 'min/km' })
      const dummy = new DummyVO(pace.value)

      expect(pace.equals(dummy as unknown as Pace)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const pace = PaceMother.valid()

      expect(pace.equals(null)).toBe(false)
      expect(pace.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation in min/mi correctly', () => {
      const validMinMiData = PaceMother.validMinMiValue()
      const pace = Pace.fromProps({ value: validMinMiData.value, unit: validMinMiData.unit })

      expect(pace.toString()).toBe(validMinMiData.formatted['min/mi'].short)
    })

    it('should return string representation in min/km correctly', () => {
      const validMinKmData = PaceMother.validMinKmValue()
      const pace = Pace.fromProps({ value: validMinKmData.value, unit: validMinKmData.unit })

      expect(pace.toString()).toBe(validMinKmData.formatted['min/km'].short)
    })
  })

  describe('getConfiguration', () => {
    it('should return the correct configuration', () => {
      const config = Pace.getConfiguration()

      expect(config.defaultUnit).toBe(Pace.DEFAULT_UNIT)
      expect(config.min).toBe(Pace.MIN_PACE.numericValue)
      expect(config.max).toBe(Pace.MAX_PACE.numericValue)
      expect(config.units).toContain('min/km')
      expect(config.units).toContain('min/mi')
    })
  })

  describe('convertTo', () => {
    it('should convert min/mi to min/km correctly', () => {
      const validMinMiData = PaceMother.validMinMiValue()

      const pace = Pace.fromProps({ value: validMinMiData.value, unit: validMinMiData.unit })
      const converted = pace.convertTo('min/km')

      expect(converted.equals(NumericValue.fromValue(validMinMiData.conversions['min/km'].long))).toBe(true)
    })

    it('should return the same value if target unit is the same as current unit', () => {
      const validMinKmData = PaceMother.validMinKmValue()

      const pace = Pace.fromProps({ value: validMinKmData.value, unit: validMinKmData.unit })
      const converted = pace.convertTo('min/km')

      expect(converted.equals(NumericValue.fromValue(validMinKmData.value))).toBe(true)
    })
  })
})
