import { Distance, SupportedDistanceUnits } from '~/src/modules/Shared/Domain/ValueObject/Distance'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DistanceMother } from '~/src/test/mothers/Domain/Shared/DistanceMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

class DummyVO extends ValueObject<{ value: number; unit: string }> {}

describe('Distance', () => {
  describe('safeCreate', () => {
    it('should return success when distance and unit are valid', () => {
      const validDistanceValue = Array.from({ length: 100 }, () => DistanceMother.randomValues())

      validDistanceValue.forEach((props) => {
        const result = Distance.safeCreate(props)

        expect(result.success).toBe(true)
        expect(result['value'].value.unit).toBe('m')
      })
    })

    it.each(DistanceMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      const result = Distance.safeCreate({ value: invalidValue, unit: DistanceMother.VALID_UNIT })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidDistance(String(invalidValue)))
    })

    it.each(DistanceMother.INVALID_UNITS)('should return fail when unit is invalid: %s', (invalidUnit) => {
      const result = Distance.safeCreate({ value: DistanceMother.VALID_METERS, unit: invalidUnit })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(SharedDomainException.invalidUnit('Distance', invalidUnit, [...SupportedDistanceUnits]))
    })
  })

  describe('fromProps', () => {
    it('should not throw when distance and unit are valid', () => {
      const validDistances = Array.from({ length: 100 }, () => DistanceMother.randomValues())

      validDistances.forEach((props) => {
        expect(() => Distance.fromProps(props)).not.toThrow()
      })
    })

    it.each(DistanceMother.INVALID_VALUES)('should throw error when value is invalid: %s', (invalidValue) => {
      expect(() => Distance.fromProps({ value: invalidValue, unit: DistanceMother.VALID_UNIT })).toThrow(
        SharedDomainException.invalidDistance(String(invalidValue)),
      )
    })

    it.each(DistanceMother.INVALID_UNITS)('should throw error when unit is invalid: %s', (invalidUnit) => {
      expect(() => Distance.fromProps({ value: DistanceMother.VALID_METERS, unit: invalidUnit })).toThrow(
        SharedDomainException.invalidUnit('Distance', invalidUnit, [...SupportedDistanceUnits]),
      )
    })
  })

  describe('toDTO', () => {
    it('should return correct DTO structure and conversions', () => {
      const metersData = DistanceMother.validMetersValue()
      const kmData = DistanceMother.validKmValue()

      const distance = Distance.fromProps({ value: metersData.value, unit: metersData.unit })

      const dto = distance.toDTO()

      expect(dto).toStrictEqual({
        value: metersData.value,
        unit: metersData.unit,
        meters: metersData.value,
        conversions: {
          m: metersData.value,
          km: kmData.value,
        },
      })
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const validKmData = DistanceMother.validKmValue()

      const valueA = new DummyVO({ value: validKmData.value, unit: validKmData.unit })
      const valueB = Distance.fromProps({ value: validKmData.value, unit: validKmData.unit })

      expect(valueA.equals(valueB)).toBe(false)
    })

    it('should return true when both distances represent same magnitude', () => {
      const validKmData = DistanceMother.validKmValue()
      const validMData = DistanceMother.validMetersValue()

      const distance1 = Distance.fromProps({ value: validKmData.value, unit: validKmData.unit })
      const distance2 = Distance.fromProps({ value: validMData.value, unit: validMData.unit })

      expect(distance1.equals(distance2)).toBe(true)
    })

    it('should return false when magnitudes are different', () => {
      const validMData = DistanceMother.validMetersValue()

      const distance1 = Distance.fromProps({ value: validMData.value, unit: validMData.unit })
      const distance2 = Distance.fromProps({ value: validMData.value + 1, unit: validMData.unit })

      expect(distance1.equals(distance2)).toBe(false)
    })

    it('should return false when comparing with null or undefined', () => {
      const distance = DistanceMother.valid()

      expect(distance.equals(null)).toBe(false)
      expect(distance.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation in meters', () => {
      const validMetersData = DistanceMother.validMetersValue()
      const distance = Distance.fromProps({ value: validMetersData.value, unit: validMetersData.unit })

      expect(distance.toString()).toBe(`${validMetersData.value} ${validMetersData.unit}`)
    })
  })

  it('should normalize kilometers to meters correctly', () => {
    const kmData = DistanceMother.validKmValue()
    const distance = Distance.fromProps({ value: kmData.value, unit: kmData.unit })

    const expectedStoredValues = DistanceMother.validMetersValue()

    expect(distance.value.value).toBe(expectedStoredValues.value)
    expect(distance.value.unit).toBe(expectedStoredValues.unit)
  })
})
