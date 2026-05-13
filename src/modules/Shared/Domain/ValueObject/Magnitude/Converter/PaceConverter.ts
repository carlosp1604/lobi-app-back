import { PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Pace'
import { MagnitudeConverterInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/MagnitudeConverterInterface'
import { DecimalNumber, DecimalNumberSource } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'

const PACE_FACTORS: Record<PaceUnit, DecimalNumber> = {
  'min/km': DecimalNumber.create('1'),
  'min/mi': DecimalNumber.create('1.609344'),
}

export const PaceConverter: MagnitudeConverterInterface<PaceUnit> = {
  convert(value: DecimalNumberSource, fromUnit: PaceUnit, toUnit: PaceUnit): DecimalNumber {
    const decimalValue = DecimalNumber.create(value)

    if (fromUnit === toUnit) {
      return decimalValue
    }

    const factorFrom = PACE_FACTORS[fromUnit]
    const factorTo = PACE_FACTORS[toUnit]

    return decimalValue.multiply(factorTo).divide(factorFrom)
  },
}
