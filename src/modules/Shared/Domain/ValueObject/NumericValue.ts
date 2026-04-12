import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SUPPORTED_PRECISIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
export type Precision = (typeof SUPPORTED_PRECISIONS)[number]

export class NumericValue extends ValueObject<number> {
  public static readonly DEFAULT_DECIMALS: Precision = 8
  public static readonly MAX_DECIMALS: Precision = 8
  public static readonly MIN_DECIMALS: Precision = 0

  private constructor(props: number) {
    super(props)
  }

  private static validateNumericRules(value: number): boolean {
    return !isNaN(value) && isFinite(value)
  }

  private static adjust(type: 'round' | 'trunc', rawValue: number, decimals: Precision): number {
    if (decimals === 0) {
      return Math[type](rawValue)
    }

    const parts = rawValue.toString().split('e')
    const shiftedBase = Number(parts[0] + 'e' + (parts[1] ? Number(parts[1]) + decimals : decimals))

    const operated = Math[type](shiftedBase)

    const resultParts = operated.toString().split('e')
    return Number(resultParts[0] + 'e' + (resultParts[1] ? Number(resultParts[1]) - decimals : -decimals))
  }

  public static safeCreate(value: number): Result<NumericValue, SharedDomainException> {
    if (!this.validateNumericRules(value)) {
      return fail(SharedDomainException.invalidNumericValue(value, this.MIN_DECIMALS, this.MAX_DECIMALS, this.DEFAULT_DECIMALS))
    }

    const cleanValue = this.adjust('trunc', value, this.DEFAULT_DECIMALS)

    if (isNaN(cleanValue)) {
      return fail(SharedDomainException.invalidNumericValue(value, this.MIN_DECIMALS, this.MAX_DECIMALS, this.DEFAULT_DECIMALS))
    }

    return success(new NumericValue(cleanValue))
  }

  public static fromValue(value: number): NumericValue {
    const magnitudeValueResult = this.safeCreate(value)

    if (!magnitudeValueResult.success) {
      throw magnitudeValueResult.error
    }

    return magnitudeValueResult.value
  }

  public equals(other?: NumericValue | null): boolean {
    if (other === null || other === undefined || other.constructor !== this.constructor) {
      return false
    }

    return this._value === other._value
  }

  public round(precision: Precision): number {
    return NumericValue.adjust('round', this._value, precision)
  }

  public truncate(precision: Precision): number {
    return NumericValue.adjust('trunc', this._value, precision)
  }

  public multiply(other: NumericValue): NumericValue {
    return NumericValue.fromValue(this._value * other._value)
  }

  public divide(other: NumericValue): NumericValue {
    if (other._value === 0) {
      throw SharedDomainException.cannotDivideMagnitudeByZero()
    }

    return NumericValue.fromValue(this._value / other._value)
  }

  public add(other: NumericValue): NumericValue {
    return NumericValue.fromValue(this._value + other._value)
  }

  public subtract(other: NumericValue): NumericValue {
    return NumericValue.fromValue(this._value - other._value)
  }

  public lessThan(other: NumericValue): boolean {
    return this._value < other._value
  }

  public lessOrEqualThan(other: NumericValue): boolean {
    return this._value <= other._value
  }

  public greaterThan(other: NumericValue): boolean {
    return this._value > other._value
  }

  public greaterOrEqualThan(other: NumericValue): boolean {
    return this._value >= other._value
  }

  public integerPart(): number {
    return Math.trunc(this._value)
  }

  public decimalPart(): number {
    const decimals = this._value - this.integerPart()
    return NumericValue.adjust('round', decimals, NumericValue.DEFAULT_DECIMALS)
  }

  get numericValue(): number {
    return this._value
  }
}
