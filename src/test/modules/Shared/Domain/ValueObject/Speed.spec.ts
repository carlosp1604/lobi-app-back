import { Speed, SupportedSpeedUnits } from '~/src/modules/Shared/Domain/ValueObject/Speed'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SpeedMother } from '~/src/test/mothers/Domain/Shared/SpeedMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

class DummyVO extends ValueObject<{ value: number; unit: string }> {}

describe('Speed', () => {
  describe('safeCreate', () => {
    it('should return success when speed and unit are valid', () => {
      const validSpeedValue = Array.from({ length: 100 }, () => SpeedMother.randomValues())

      validSpeedValue.forEach((props) => {
        const result = Speed.safeCreate(props)

        expect(result.success).toBe(true)
        expect(result['value'].value.unit).toBe('km/h')
      })
    })

    it.each(SpeedMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      const result = Speed.safeCreate({ value: invalidValue, unit: SpeedMother.VALID_UNIT })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidSpeed(String(invalidValue)))
    })

    it.each(SpeedMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      const result = Speed.safeCreate({ value: SpeedMother.VALID_KMH, unit: invalidUnit })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidUnit('Speed', invalidUnit, [...SupportedSpeedUnits]))
    })
  })

  describe('fromProps', () => {
    it('should not throw when speed and unit are valid', () => {
      const validSpeeds = Array.from({ length: 100 }, () => SpeedMother.randomValues())

      validSpeeds.forEach((props) => {
        expect(() => Speed.fromProps(props)).not.toThrow()
      })
    })

    it.each(SpeedMother.INVALID_VALUES)('should throw error when value is invalid: %s', (invalidValue) => {
      expect(() => Speed.fromProps({ value: invalidValue, unit: SpeedMother.VALID_UNIT })).toThrow(
        SharedDomainException.invalidSpeed(String(invalidValue)),
      )
    })

    it.each(SpeedMother.INVALID_UNITS)('should throw error when unit is invalid: %s', (invalidUnit) => {
      expect(() => Speed.fromProps({ value: SpeedMother.VALID_KMH, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Speed', invalidUnit, [...SupportedSpeedUnits]),
      )
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const validKmhData = SpeedMother.validKmhValue()
      const validMphData = SpeedMother.validMphValue()

      const speed = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })

      const dto = speed.toDTO()

      expect(dto).toStrictEqual({
        value: validKmhData.value,
        unit: validKmhData.unit,
        conversions: {
          'km/h': validKmhData.value,
          'mi/h': validMphData.value,
        },
      })
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const validMphData = SpeedMother.validMphValue()

      const valueA = new DummyVO({ value: validMphData.value, unit: validMphData.unit })
      const valueB = Speed.fromProps({ value: validMphData.value, unit: validMphData.unit })

      expect(valueA.equals(valueB)).toBe(false)
    })

    it('should return true when both speeds represent same magnitude', () => {
      const validMphData = SpeedMother.validMphValue()
      const validKmhData = SpeedMother.validKmhValue()

      const speed1 = Speed.fromProps({ value: validMphData.value, unit: validMphData.unit })
      const speed2 = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })

      expect(speed1.equals(speed2)).toBe(true)
    })

    it('should return false when magnitudes are different', () => {
      const validKmhData = SpeedMother.validKmhValue()

      const speed1 = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })
      const speed2 = Speed.fromProps({ value: validKmhData.value + 1, unit: validKmhData.unit })

      expect(speed1.equals(speed2)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const speed = SpeedMother.valid()

      expect(speed.equals(null)).toBe(false)
      expect(speed.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation in km/h', () => {
      const validKmhData = SpeedMother.validKmhValue()
      const speed = Speed.fromProps({ value: validKmhData.value, unit: validKmhData.unit })

      expect(speed.toString()).toBe(`${validKmhData.value} ${validKmhData.unit}`)
    })
  })

  it('should normalize to km/h correctly', () => {
    const validMphData = SpeedMother.validMphValue()
    const speed = Speed.fromProps({ value: validMphData.value, unit: validMphData.unit })

    const expectedStoredValues = SpeedMother.validKmhValue()

    expect(speed.value.value).toBe(expectedStoredValues.value)
    expect(speed.value.unit).toBe(expectedStoredValues.unit)
  })
})
