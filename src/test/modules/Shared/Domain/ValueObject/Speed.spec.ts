import { Speed, SpeedProps, SupportedSpeedUnits } from '~/src/modules/Shared/Domain/ValueObject/Speed'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SpeedMother } from '~/src/test/mothers/Domain/Shared/SpeedMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { NumericValue } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'

class DummyVO extends ValueObject<SpeedProps> {}

describe('Speed', () => {
  describe('safeCreate', () => {
    it('should return success when speed and unit are valid', () => {
      const validSpeeds = Array.from({ length: 100 }, () => SpeedMother.randomSpeed())

      validSpeeds.forEach((value) => {
        const result = Speed.safeCreate({ value, unit: Speed.DEFAULT_UNIT })

        expect(result.success).toBe(true)
        if (result.success) {
          const speed = result.value
          expect(speed.value.unit).toBe(Speed.DEFAULT_UNIT)
          expect(speed.value.value.numericValue).toBe(value)
        }
      })
    })

    it.each(SpeedMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      const result = Speed.safeCreate({ value: invalidValue, unit: Speed.DEFAULT_UNIT })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toStrictEqual(SharedDomainException.invalidSpeed(String(invalidValue)))
      }
    })

    it.each(SpeedMother.INVALID_UNITS)('should return fail when unit is not supported: %s', (invalidUnit) => {
      const result = Speed.safeCreate({ value: SpeedMother.VALID_KMH, unit: invalidUnit })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toStrictEqual(SharedDomainException.invalidUnit('Speed', invalidUnit, [...SupportedSpeedUnits]))
      }
    })

    it('should normalize to km/h correctly when input unit is mi/h', () => {
      const validMphData = SpeedMother.validMphValue()

      const result = Speed.safeCreate({ value: validMphData.value, unit: validMphData.unit })

      expect(result.success).toBe(true)
      if (result.success) {
        const speed = result.value

        expect(speed.value.value.equals(NumericValue.fromValue(validMphData.value))).toBe(true)
        expect(speed.value.normalizedValue.equals(NumericValue.fromValue(validMphData.conversions['km/h'].long))).toBe(true)
        expect(speed.value.unit).toBe('mi/h')
      }
    })

    it('should normalize to km/h correctly when input unit is km/h', () => {
      const validKmhData = SpeedMother.validKmhValue()

      const result = Speed.safeCreate({ value: validKmhData.value, unit: validKmhData.unit })

      expect(result.success).toBe(true)
      if (result.success) {
        const speed = result.value

        expect(speed.value.value.equals(NumericValue.fromValue(validKmhData.value))).toBe(true)
        expect(speed.value.unit).toBe('km/h')
        expect(speed.value.normalizedValue.equals(speed.value.value)).toBe(true)
      }
    })
  })

  describe('fromProps', () => {
    it('should not throw error when speed and unit are valid', () => {
      const validSpeeds = Array.from({ length: 100 }, () => SpeedMother.randomSpeed())

      validSpeeds.forEach((value) => {
        expect(() => Speed.fromProps({ value, unit: Speed.DEFAULT_UNIT })).not.toThrow()
      })
    })

    it.each(SpeedMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      expect(() => Speed.fromProps({ value: invalidValue, unit: Speed.DEFAULT_UNIT })).toThrow(
        SharedDomainException.invalidSpeed(String(invalidValue)),
      )
    })

    it.each(SpeedMother.INVALID_UNITS)('should return fail when unit is not supported: %s', (invalidUnit) => {
      expect(() => Speed.fromProps({ value: SpeedMother.VALID_KMH, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Speed', invalidUnit, [...SupportedSpeedUnits]),
      )
    })
  })

  describe('convertTo', () => {
    it('should convert mi/h to km/h correctly', () => {
      const validMphData = SpeedMother.validMphValue()

      const speed = Speed.fromProps({ value: validMphData.value, unit: validMphData.unit })
      const converted = speed.convertTo('km/h')

      expect(converted.equals(NumericValue.fromValue(validMphData.conversions['km/h'].long))).toBe(true)
    })

    it('should return the same value if target unit is the same as current unit', () => {
      const validKmhData = SpeedMother.validKmhValue()

      const speed = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })
      const converted = speed.convertTo('km/h')

      expect(converted.equals(NumericValue.fromValue(validKmhData.value))).toBe(true)
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const validKmhData = SpeedMother.validKmhValue()

      const speed = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })

      const dto = speed.toDTO()

      expect(dto).toEqual({
        value: validKmhData.value,
        unit: 'km/h',
        conversions: {
          'km/h': validKmhData.conversions['km/h'].short,
          'mi/h': validKmhData.conversions['mi/h'].short,
        },
        formatted: {
          'km/h': validKmhData.formatted['km/h'],
          'mi/h': validKmhData.formatted['mi/h'],
        },
      })
    })
  })

  describe('equals', () => {
    it('should return true when both speeds represent same magnitude', () => {
      const speed1 = Speed.fromProps({ value: Speed.KM_TO_MI_FACTOR.numericValue, unit: 'km/h' })
      const speed2 = Speed.fromProps({ value: 1, unit: 'mi/h' })

      expect(speed1.equals(speed2)).toBe(true)
    })

    it('should return false when speeds represent different magnitudes', () => {
      const speed1 = Speed.fromProps({ value: SpeedMother.VALID_KMH, unit: 'km/h' })
      const speed2 = Speed.fromProps({ value: SpeedMother.VALID_KMH + 1, unit: 'km/h' })

      expect(speed1.equals(speed2)).toBe(false)
    })

    it('should return false when types are different', () => {
      const speed = Speed.fromProps({ value: SpeedMother.VALID_KMH, unit: 'km/h' })
      const dummy = new DummyVO(speed.value)

      expect(speed.equals(dummy as unknown as Speed)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const speed = SpeedMother.valid()

      expect(speed.equals(null)).toBe(false)
      expect(speed.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation in mi/h correctly', () => {
      const validMphData = SpeedMother.validMphValue()

      const speedMi = Speed.fromProps({ value: validMphData.value, unit: validMphData.unit })
      expect(speedMi.toString()).toBe(validMphData.formatted['mi/h'])
    })

    it('should return string representation in km/h correctly', () => {
      const validKmhData = SpeedMother.validKmhValue()

      const speedKm = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })
      expect(speedKm.toString()).toBe(validKmhData.formatted['km/h'])
    })
  })

  describe('getConfiguration', () => {
    it('should return the correct configuration', () => {
      const config = Speed.getConfiguration()

      expect(config.defaultUnit).toBe(Speed.DEFAULT_UNIT)
      expect(config.min).toBe(0)
      expect(config.max).toBe(2000)
      expect(config.units).toContain('km/h')
      expect(config.units).toContain('mi/h')
    })
  })
})
