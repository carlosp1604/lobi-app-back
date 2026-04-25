import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class IntegerNumber extends ValueObject<number> {
  private __integerNumberBrand: void

  public static readonly MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER
  public static readonly MIN_SAFE_VALUE = Number.MIN_SAFE_INTEGER

  private constructor(value: number) {
    super(value)
  }

  public static safeCreate(value: number): Result<IntegerNumber, SharedDomainException> {
    if (!Number.isInteger(value) || value > this.MAX_SAFE_VALUE || value < this.MIN_SAFE_VALUE) {
      return fail(SharedDomainException.invalidInteger(value, this.MAX_SAFE_VALUE, this.MAX_SAFE_VALUE))
    }

    return success(new IntegerNumber(value))
  }

  public static fromNumber(value: number): IntegerNumber {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public isGreaterThan(other: IntegerNumber): boolean {
    return this._value > other.value
  }

  public isLessThan(other: IntegerNumber): boolean {
    return this._value < other.value
  }

  public multiply(other: IntegerNumber): IntegerNumber {
    return IntegerNumber.fromNumber(this._value * other.value)
  }

  public get value(): number {
    return this._value
  }

  public toPrimitives(): number {
    return this._value
  }
}
