import { DecimalNumber, DecimalNumberSource } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'

export interface MagnitudeConverterInterface<TUnit extends string> {
  convert(value: DecimalNumberSource, fromUnit: TUnit, toUnit: TUnit): DecimalNumber
}
