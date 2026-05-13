import { SpeedUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Speed'
import { MagnitudeConverterInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/MagnitudeConverterInterface'
import { DecimalNumber, DecimalNumberSource } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'

const SPEED_FACTORS: Record<SpeedUnit, DecimalNumber> = {
  'km/h': DecimalNumber.create('1'),
  'mi/h': DecimalNumber.create('1.609344'),
}

export const SpeedConverter: MagnitudeConverterInterface<SpeedUnit> = {
  convert(value: DecimalNumberSource, fromUnit: SpeedUnit, toUnit: SpeedUnit): DecimalNumber {
    const decimalValue = DecimalNumber.create(value)

    if (fromUnit === toUnit) {
      return decimalValue
    }

    const factorFrom = SPEED_FACTORS[fromUnit]
    const factorTo = SPEED_FACTORS[toUnit]

    return decimalValue.multiply(factorFrom).divide(factorTo)
  },
}
