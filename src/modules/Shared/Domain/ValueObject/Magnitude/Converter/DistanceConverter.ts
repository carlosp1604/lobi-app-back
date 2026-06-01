import { DistanceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Distance'
import { MagnitudeConverterInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/MagnitudeConverterInterface'
import { DecimalNumber, DecimalNumberSource } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'

export const DISTANCE_FACTORS: Record<DistanceUnit, DecimalNumber> = {
  m: DecimalNumber.create('1'),
  km: DecimalNumber.create('1000'),
  mi: DecimalNumber.create('1609.344'),
}

export const DistanceConverter: MagnitudeConverterInterface<DistanceUnit> = {
  convert(value: DecimalNumberSource, fromUnit: DistanceUnit, toUnit: DistanceUnit): DecimalNumber {
    const decimalValue = DecimalNumber.create(value)

    if (fromUnit === toUnit) {
      return decimalValue
    }

    const factorFrom = DISTANCE_FACTORS[fromUnit]
    const factorTo = DISTANCE_FACTORS[toUnit]

    return decimalValue.multiply(factorFrom).divide(factorTo)
  },
}
