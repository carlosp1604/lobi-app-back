import { NumericValue, SUPPORTED_PRECISIONS } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'

export class NumericValueMother {
  public static readonly INVALID_VALUES = [NaN, Infinity, -Infinity]
  public static readonly INVALID_PRECISIONS = [-1, 11, -50, 100, 2.5, 3.14159, NaN, Infinity, -Infinity]

  public static readonly VALID_VALUES = [0, 1, -1, 42.5, 9999.99999999, 205.05300309, 0.00000001, -0.00000001]
  public static readonly VALID_VALUE = 6174.1089
  public static readonly VALID_PRECISION = NumericValue.DEFAULT_DECIMALS

  public static valid(): NumericValue {
    return NumericValue.fromValue(this.VALID_VALUE)
  }

  public static random(): NumericValue {
    const randomPrecision = SUPPORTED_PRECISIONS[Math.floor(Math.random() * SUPPORTED_PRECISIONS.length)]
    return NumericValue.fromValue(this.randomValue(true, randomPrecision))
  }

  public static randomValue(allowNegative: boolean = true, precision: number = NumericValue.DEFAULT_DECIMALS): number {
    const rawValue = Math.random() * 10000

    let finalValue = parseFloat(rawValue.toFixed(precision))

    if (allowNegative && Math.random() > 0.5) {
      finalValue = -finalValue
    }

    return finalValue
  }
}
