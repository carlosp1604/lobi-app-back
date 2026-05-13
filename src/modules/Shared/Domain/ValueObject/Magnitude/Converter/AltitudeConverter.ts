import { AltitudeUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Altitude'
import { MagnitudeConverterInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/MagnitudeConverterInterface'
import { DecimalNumber, DecimalNumberSource } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'

const ALTITUDE_FACTORS: Record<AltitudeUnit, DecimalNumber> = {
  m: DecimalNumber.create('1'),
  ft: DecimalNumber.create('0.3048'),
}

export const AltitudeConverter: MagnitudeConverterInterface<AltitudeUnit> = {
  convert(value: DecimalNumberSource, fromUnit: AltitudeUnit, toUnit: AltitudeUnit): DecimalNumber {
    const decimalValue = DecimalNumber.create(value)

    if (fromUnit === toUnit) {
      return decimalValue
    }

    const factorFrom = ALTITUDE_FACTORS[fromUnit]
    const factorTo = ALTITUDE_FACTORS[toUnit]

    return decimalValue.multiply(factorFrom).divide(factorTo)
  },
}
