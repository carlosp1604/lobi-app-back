import { Altitude, SupportedAltitudeUnits } from '~/src/modules/Shared/Domain/ValueObject/Altitude'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { AltitudeMother } from '~/src/test/mothers/Domain/Shared/AltitudeMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

class DummyVO extends ValueObject<{ value: number; unit: string }> {}

describe('Altitude', () => {
  describe('safeCreate', () => {
    it('should return success when altitude and unit are valid', () => {
      const validAltitudeValue = Array.from({ length: 100 }, () => AltitudeMother.randomValues())

      validAltitudeValue.forEach((props) => {
        const result = Altitude.safeCreate(props)

        expect(result.success).toBe(true)
        expect(result['value'].value.unit).toBe('m')
      })
    })

    it.each(AltitudeMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      const result = Altitude.safeCreate({ value: invalidValue, unit: AltitudeMother.VALID_UNIT })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidAltitude(String(invalidValue)))
    })

    it.each(AltitudeMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      const result = Altitude.safeCreate({ value: AltitudeMother.VALID_METERS, unit: invalidUnit })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidUnit('Altitude', invalidUnit, [...SupportedAltitudeUnits]))
    })
  })

  describe('fromNumber', () => {
    it('should not throw when altitude and unit are valid', () => {
      const validAltitudes = Array.from({ length: 100 }, () => AltitudeMother.randomValues())

      validAltitudes.forEach((props) => {
        expect(() => Altitude.fromProps(props)).not.toThrow()
      })
    })

    it.each(AltitudeMother.INVALID_VALUES)('should throw error when value is invalid: %s', (invalidValue) => {
      expect(() => Altitude.fromProps({ value: invalidValue, unit: AltitudeMother.VALID_UNIT })).toThrow(
        SharedDomainException.invalidAltitude(String(invalidValue)),
      )
    })

    it.each(AltitudeMother.INVALID_UNITS)('should throw error when unit is invalid: %s', (invalidUnit) => {
      expect(() => Altitude.fromProps({ value: AltitudeMother.VALID_METERS, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Altitude', invalidUnit, [...SupportedAltitudeUnits]),
      )
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const metersData = AltitudeMother.validMetersValue()
      const ftData = AltitudeMother.validFtValue()

      const altitude = Altitude.fromProps({ value: metersData.value, unit: metersData.unit })

      const dto = altitude.toDTO()

      expect(dto).toStrictEqual({
        value: metersData.value,
        unit: metersData.unit,
        meters: metersData.value,
        conversions: {
          m: metersData.value,
          ft: ftData.value,
        },
      })
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const validFtData = AltitudeMother.validFtValue()

      const valueA = new DummyVO({ value: validFtData.value, unit: validFtData.unit })
      const valueB = Altitude.fromProps({ value: validFtData.value, unit: validFtData.unit })

      expect(valueA.equals(valueB)).toBe(false)
    })

    it('should return true when both altitudes represent same magnitude', () => {
      const validFtData = AltitudeMother.validFtValue()
      const validMData = AltitudeMother.validMetersValue()

      const altitude1 = Altitude.fromProps({ value: validFtData.value, unit: validFtData.unit })
      const altitude2 = Altitude.fromProps({ value: validMData.value, unit: validMData.unit })

      expect(altitude1.equals(altitude2)).toBe(true)
    })

    it('should return false when magnitudes are different', () => {
      const validMData = AltitudeMother.validMetersValue()

      const altitude1 = Altitude.fromProps({ value: validMData.value, unit: validMData.unit })
      const altitude2 = Altitude.fromProps({ value: validMData.value + 1, unit: validMData.unit })

      expect(altitude1.equals(altitude2)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const altitude = AltitudeMother.valid()

      expect(altitude.equals(null)).toBe(false)
      expect(altitude.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation in meters', () => {
      const validMetersData = AltitudeMother.validMetersValue()
      const altitude = Altitude.fromProps({ value: validMetersData.value, unit: validMetersData.unit })

      expect(altitude.toString()).toBe(`${AltitudeMother.VALID_METERS} m`)
    })
  })

  it('should normalize feet to meters correctly', () => {
    const ftData = AltitudeMother.validFtValue()
    const altitude = Altitude.fromProps({ value: ftData.value, unit: ftData.unit })

    const expectedStoredValues = AltitudeMother.validMetersValue()

    expect(altitude.value.value).toBe(expectedStoredValues.value)
    expect(altitude.value.unit).toBe(expectedStoredValues.unit)
  })
})
