import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export type IntegerNumberSource = string | number

export class IntegerNumber extends ValueObject<number> implements SerializableInterface<number> {
  private __integerNumberBrand: void

  public static readonly MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER
  public static readonly MIN_SAFE_VALUE = Number.MIN_SAFE_INTEGER

  private constructor(value: number) {
    super(value)
  }

  public static safeCreate(value: IntegerNumberSource): Result<IntegerNumber, SharedDomainException> {
    const numericValue = typeof value === 'string' ? Number(value) : value

    if (
      isNaN(numericValue) ||
      !Number.isInteger(numericValue) ||
      numericValue > this.MAX_SAFE_VALUE ||
      numericValue < this.MIN_SAFE_VALUE
    ) {
      return fail(SharedDomainException.invalidInteger(String(value), this.MIN_SAFE_VALUE, this.MAX_SAFE_VALUE))
    }

    return success(new IntegerNumber(numericValue))
  }

  public static create(value: IntegerNumberSource): IntegerNumber {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public isGreaterThan(other: IntegerNumber): boolean {
    return this._value > other._value
  }

  public isGreaterThanOrEqual(other: IntegerNumber): boolean {
    return this._value >= other._value
  }

  public isLessThan(other: IntegerNumber): boolean {
    return this._value < other._value
  }

  public isLessThanOrEqual(other: IntegerNumber): boolean {
    return this._value <= other._value
  }

  public multiply(other: IntegerNumber): IntegerNumber {
    return IntegerNumber.create(this._value * other._value)
  }

  public add(other: IntegerNumber): IntegerNumber {
    return IntegerNumber.create(this._value + other._value)
  }

  public subtract(other: IntegerNumber): IntegerNumber {
    return IntegerNumber.create(this._value - other._value)
  }

  public get value(): number {
    return this._value
  }

  public toPrimitives(): number {
    return this._value
  }
}
