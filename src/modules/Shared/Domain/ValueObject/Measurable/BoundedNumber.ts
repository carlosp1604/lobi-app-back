import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SUPPORTED_PRECISIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
export type Precision = (typeof SUPPORTED_PRECISIONS)[number]

export type BoundedNumberProps = {
  numericValue: number
  stringValue: string
}

export class BoundedNumber extends ValueObject<BoundedNumberProps> {
  private __boundedNumberBrand: void

  public static readonly MAX_SAFE_VALUE = 50000000
  public static readonly DEFAULT_PRECISION: Precision = 8

  private constructor(props: BoundedNumberProps) {
    super(props)
  }

  private static validateNumericRules(value: number): boolean {
    const isBasicValid = isFinite(value) && !isNaN(value)
    const isPrecisionSafe = Math.abs(value) <= this.MAX_PRECISION_SAFE_VALUE

    return isBasicValid && isPrecisionSafe
  }

  private static get MAX_PRECISION_SAFE_VALUE(): number {
    return this.MAX_SAFE_VALUE
  }

  private static stringTruncate(value: string, decimals: Precision): BoundedNumberProps {
    const [integer, fraction] = value.split('.')

    if (decimals === 0 || !fraction) {
      return {
        numericValue: Number(integer),
        stringValue: integer,
      }
    }

    if (fraction.length <= decimals) {
      return {
        numericValue: Number(value),
        stringValue: value,
      }
    }

    const truncatedString = `${integer}.${fraction.substring(0, decimals)}`

    return {
      numericValue: Number(truncatedString),
      stringValue: truncatedString,
    }
  }

  public static safeCreate(value: string): Result<BoundedNumber, SharedDomainException> {
    const trimmedRawValue = value.trim()
    if (!trimmedRawValue) {
      return fail(
        SharedDomainException.invalidBoundedNumber(trimmedRawValue, -this.MAX_SAFE_VALUE, this.MAX_SAFE_VALUE, this.DEFAULT_PRECISION),
      )
    }

    const numericValue = Number(trimmedRawValue)

    if (!this.validateNumericRules(numericValue)) {
      return fail(SharedDomainException.invalidBoundedNumber(value, -this.MAX_SAFE_VALUE, this.MAX_SAFE_VALUE, this.DEFAULT_PRECISION))
    }

    const normalized = numericValue.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20,
    })

    const cleanValues = this.stringTruncate(normalized, this.DEFAULT_PRECISION)

    if (!this.validateNumericRules(cleanValues.numericValue)) {
      return fail(SharedDomainException.invalidBoundedNumber(value, -this.MAX_SAFE_VALUE, this.MAX_SAFE_VALUE, this.DEFAULT_PRECISION))
    }

    return success(new BoundedNumber(cleanValues))
  }

  public static fromString(value: string): BoundedNumber {
    const boundedNumberResult = this.safeCreate(value)

    if (!boundedNumberResult.success) {
      throw boundedNumberResult.error
    }

    return boundedNumberResult.value
  }

  public equals(other?: BoundedNumber | null): boolean {
    if (other === null || other === undefined || other.constructor !== this.constructor) {
      return false
    }

    return this._value.numericValue === other._value.numericValue
  }

  public round(precision: Precision): number {
    const [integer, fraction] = this._value.stringValue.split('.')

    if (!fraction || fraction.length <= precision) {
      return this._value.numericValue
    }

    const decider = parseInt(fraction[precision], 10)

    if (decider < 5) {
      return this.truncate(precision)
    }

    const integerPart = integer.replace('-', '')
    const numberToIncrement = BigInt(integerPart + fraction.substring(0, precision))
    const incremented = (numberToIncrement + 1n).toString()

    let resultStr: string
    if (precision === 0) {
      resultStr = incremented
    } else {
      const totalDigits = incremented.length
      const integerDigits = totalDigits - precision

      if (integerDigits <= 0) {
        resultStr = '0.' + '0'.repeat(Math.abs(integerDigits)) + incremented
      } else {
        resultStr = incremented.substring(0, integerDigits) + '.' + incremented.substring(integerDigits)
      }
    }

    if (this._value.numericValue < 0) {
      resultStr = '-' + resultStr
    }

    return Number(resultStr)
  }

  public truncate(precision: Precision): number {
    return BoundedNumber.stringTruncate(this._value.stringValue, precision).numericValue
  }

  public multiply(other: BoundedNumber): BoundedNumber {
    return BoundedNumber.fromString((this._value.numericValue * other._value.numericValue).toString())
  }

  public divide(other: BoundedNumber): BoundedNumber {
    if (other._value.numericValue === 0) {
      throw SharedDomainException.cannotDivideByZero()
    }
    return BoundedNumber.fromString((this._value.numericValue / other._value.numericValue).toString())
  }

  public add(other: BoundedNumber): BoundedNumber {
    return BoundedNumber.fromString((this._value.numericValue + other._value.numericValue).toString())
  }

  public subtract(other: BoundedNumber): BoundedNumber {
    return BoundedNumber.fromString((this._value.numericValue - other._value.numericValue).toString())
  }

  public lessThan(other: BoundedNumber): boolean {
    return this._value.numericValue < other._value.numericValue
  }

  public lessThanOrEqual(other: BoundedNumber): boolean {
    return this._value.numericValue <= other._value.numericValue
  }

  public greaterThan(other: BoundedNumber): boolean {
    return this._value.numericValue > other._value.numericValue
  }

  public greaterThanOrEqual(other: BoundedNumber): boolean {
    return this._value.numericValue >= other._value.numericValue
  }

  public integerPart(): number {
    return Number(this._value.stringValue.split('.')[0])
  }

  public decimalPart(): number {
    const parts = this._value.stringValue.split('.')
    const isNegative = this._value.numericValue < 0
    return parts.length > 1 ? Number(`${isNegative ? '-' : ''}0.${parts[1]}`) : Number('0.00000000')
  }

  get numericValue(): number {
    return this._value.numericValue
  }

  get stringValue(): string {
    return this._value.stringValue
  }
}
