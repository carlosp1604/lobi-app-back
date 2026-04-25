import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export enum ValidRPEValue {
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
}

export type RPEUnit = 'rpe'

export type RPEPrimitiveProps = {
  value: string
  unit: string
  normalizedValue: string
}

export class RPE extends ValueObject<ValidRPEValue> implements OrderableMagnitudeInterface<RPE>, VisitableMeasurableValueInterface {
  private __rpeBrand: void

  public static readonly DEFAULT_UNIT: RPEUnit = 'rpe'
  public static readonly MIN_RPE: ValidRPEValue = ValidRPEValue.ONE
  public static readonly MAX_RPE: ValidRPEValue = ValidRPEValue.TEN

  private constructor(value: ValidRPEValue) {
    super(value)
  }

  public static safeCreate(value: string): Result<RPE, SharedDomainException> {
    if (!this.isValidRPEValue(value)) {
      return fail(SharedDomainException.invalidRPE(value, this.MIN_RPE, this.MAX_RPE))
    }

    return success(new RPE(value as ValidRPEValue))
  }

  public static fromString(value: string): RPE {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public toString(): string {
    return `${this._value}/${RPE.MAX_RPE}`
  }

  private static isValidRPEValue(value: string): boolean {
    return Object.values(ValidRPEValue).includes(value as ValidRPEValue)
  }

  public isGreaterThan(anotherMagnitude: RPE): boolean {
    return Number(this._value) > Number(anotherMagnitude._value)
  }

  public isEqual(anotherMagnitude: RPE): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitRPE(this)
  }

  public get unit(): RPEUnit {
    return RPE.DEFAULT_UNIT
  }

  public toPrimitives(): RPEPrimitiveProps {
    const value = this._value

    return {
      unit: RPE.DEFAULT_UNIT,
      value,
      normalizedValue: value,
    }
  }
}
