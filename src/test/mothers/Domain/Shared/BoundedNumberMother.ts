import { BoundedNumber, Precision } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'

export class BoundedNumberMother {
  public static readonly INVALID_VALUES = [
    'NaN',
    'Infinity',
    '-Infinity',
    '1e8',
    '0x2faf081',
    '0b10111110101111000010000001',
    'unicorn',
    '-50000001',
    '-0x2faf081',
    '',
    '\n',
    '\t',
    '  ',
  ]
  public static readonly VALID_VALUES = ['0', '1', '-1', '42.5', '9999.99999999', '205.05300309', '0.00000001', '-0.00000001']
  public static readonly VALID_VALUE = '6174.1089'

  public static valid(): BoundedNumber {
    return BoundedNumber.fromString(this.VALID_VALUE)
  }

  public static random(): BoundedNumber {
    return BoundedNumber.fromString(this.randomValue())
  }

  public static randomValue(
    min: number = -BoundedNumber.MAX_SAFE_VALUE,
    max: number = BoundedNumber.MAX_SAFE_VALUE,
    precision: Precision = BoundedNumber.DEFAULT_PRECISION,
  ): string {
    const safeMin = Math.ceil(min + 1)
    const safeMax = Math.floor(max - 1)
    const integerPart = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin

    let decimalString = '0.'
    for (let i = 0; i < precision; i++) {
      decimalString += Math.floor(Math.random() * 10).toString()
    }

    const decimalPart = parseFloat(decimalString)

    return integerPart >= 0 ? String(integerPart + decimalPart) : String(integerPart - decimalPart)
  }
}
