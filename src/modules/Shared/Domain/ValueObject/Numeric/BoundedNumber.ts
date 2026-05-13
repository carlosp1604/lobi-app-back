import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DecimalNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export const SUPPORTED_PRECISIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
export type Precision = (typeof SUPPORTED_PRECISIONS)[number]

export class BoundedNumber extends ValueObject<DecimalNumber> implements SerializableInterface<string> {
  private __boundedNumberBrand: void

  public static readonly MAX_SAFE_VALUE = DecimalNumber.create('50000000')
  public static readonly MIN_SAFE_VALUE = DecimalNumber.create('-50000000')
  public static readonly DEFAULT_PRECISION: Precision = 8

  private constructor(props: DecimalNumber) {
    super(props)
  }

  public static safeCreate(value: string): Result<BoundedNumber, SharedDomainException> {
    const trimmedRawValue = value.trim()

    const failCreation = () => {
      const stringMaxSafeValue = this.MAX_SAFE_VALUE.toFixed()
      const stringMinSafeValue = this.MIN_SAFE_VALUE.toFixed()
      return fail(
        SharedDomainException.invalidBoundedNumber(trimmedRawValue, stringMinSafeValue, stringMaxSafeValue, this.DEFAULT_PRECISION),
      )
    }

    if (!trimmedRawValue) {
      return failCreation()
    }

    const decimalNumberResult = DecimalNumber.safeCreate(trimmedRawValue)

    if (!decimalNumberResult.success) {
      return failCreation()
    }

    const decimalNumber = decimalNumberResult.value

    if (decimalNumber.absolute().isGreaterThan(this.MAX_SAFE_VALUE)) {
      return failCreation()
    }

    const safeDecimalValue = decimalNumber.round(this.DEFAULT_PRECISION)

    return success(new BoundedNumber(safeDecimalValue))
  }

  public static create(value: string): BoundedNumber {
    const boundedNumberResult = this.safeCreate(value)

    if (!boundedNumberResult.success) {
      throw boundedNumberResult.error
    }

    return boundedNumberResult.value
  }

  public equals(other?: BoundedNumber | null): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(other._value)
  }

  public toString(): string {
    return this._value.toString()
  }

  public isLessThan(other: BoundedNumber): boolean {
    return this._value.isLessThan(other._value)
  }

  public isLessThanOrEqual(other: BoundedNumber): boolean {
    return this._value.isLessThanOrEqual(other._value)
  }

  public isGreaterThan(other: BoundedNumber): boolean {
    return this._value.isGreaterThan(other._value)
  }

  public isGreaterThanOrEqual(other: BoundedNumber): boolean {
    return this._value.isGreaterThanOrEqual(other._value)
  }

  public get numericValue(): DecimalNumber {
    return this._value
  }

  public get stringValue(): string {
    return this._value.toFixed()
  }

  public toPrimitives(): string {
    return this._value.toFixed()
  }
}
