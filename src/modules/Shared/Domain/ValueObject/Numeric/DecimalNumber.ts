import Big from 'big.js'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export type DecimalNumberSource = string | DecimalNumber

export class DecimalNumber extends ValueObject<Big> implements SerializableInterface<string> {
  private constructor(value: Big) {
    super(value)
  }

  public static safeCreate(value: DecimalNumberSource): Result<DecimalNumber, SharedDomainException> {
    if (value instanceof DecimalNumber) {
      return success(value)
    }

    const trimmedValue = value.trim()
    try {
      return success(new DecimalNumber(new Big(trimmedValue)))
    } catch {
      return fail(SharedDomainException.invalidDecimalNumber(trimmedValue))
    }
  }

  public static create(value: DecimalNumberSource): DecimalNumber {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public toString(): string {
    return this._value.toString()
  }

  public equals(vo?: DecimalNumber | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this._value.eq(vo._value)
  }

  public multiply(other: DecimalNumber): DecimalNumber {
    return DecimalNumber.create(this._value.times(other._value).toFixed())
  }

  public divide(other: DecimalNumber): DecimalNumber {
    return DecimalNumber.create(this._value.div(other._value).toFixed())
  }

  public subtract(other: DecimalNumber): DecimalNumber {
    return DecimalNumber.create(this._value.minus(other._value).toFixed())
  }

  public isEqual(other: DecimalNumber): boolean {
    return this._value.eq(other._value)
  }

  public isLessThan(other: DecimalNumber): boolean {
    return this._value.lt(other._value)
  }

  public isGreaterThan(other: DecimalNumber): boolean {
    return this._value.gt(other._value)
  }

  public isLessThanOrEqual(other: DecimalNumber): boolean {
    return this._value.lte(other._value)
  }

  public isGreaterThanOrEqual(other: DecimalNumber): boolean {
    return this._value.gte(other._value)
  }

  public round(precision: number): DecimalNumber {
    return DecimalNumber.create(this._value.round(precision, 1).toFixed())
  }

  public floor(precision: number = 0): DecimalNumber {
    return DecimalNumber.create(this._value.round(precision, 0).toFixed())
  }

  public getFractionalPart(precision: number): string {
    const fraction = this._value.abs().mod(1).toFixed(precision)
    return fraction.split('.')[1] || '0'.repeat(precision)
  }

  public absolute(): DecimalNumber {
    return new DecimalNumber(this._value.abs())
  }

  public toFixed(decimals?: number): string {
    return decimals !== undefined ? this._value.toFixed(decimals) : this._value.toFixed()
  }

  public toNumber(): number {
    return this._value.toNumber()
  }

  public toPrimitives(): string {
    return this._value.toFixed()
  }
}
