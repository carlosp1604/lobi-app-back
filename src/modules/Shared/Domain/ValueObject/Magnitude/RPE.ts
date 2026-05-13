import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

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

export type RPEInputProps = {
  value: string
  unit: string
}

export type RPEPrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export class RPE
  extends ValueObject<ValidRPEValue>
  implements OrderableMagnitudeInterface<RPE>, VisitableMagnitudeValueInterface, SerializableInterface<RPEPrimitives>
{
  private __rpeBrand: void

  public static readonly DEFAULT_UNIT: RPEUnit = 'rpe'
  public static readonly MIN_RPE: ValidRPEValue = ValidRPEValue.ONE
  public static readonly MAX_RPE: ValidRPEValue = ValidRPEValue.TEN

  private constructor(value: ValidRPEValue) {
    super(value)
  }

  public static safeCreate(props: RPEInputProps): Result<RPE, SharedDomainException> {
    const { value, unit } = props

    const unitInput = unit.trim().toLowerCase()

    if (unitInput !== this.DEFAULT_UNIT) {
      return fail(SharedDomainException.invalidUnit('RPE', unit, [this.DEFAULT_UNIT]))
    }

    if (!this.isValidRPEValue(value)) {
      return fail(SharedDomainException.invalidRPE(value, this.MIN_RPE, this.MAX_RPE))
    }

    return success(new RPE(value as ValidRPEValue))
  }

  public static create(props: RPEInputProps): RPE {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: RPEPrimitives): RPE {
    return RPE.create({ value: primitives.value, unit: primitives.unit })
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

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitRPE(this)
  }

  public get unit(): RPEUnit {
    return RPE.DEFAULT_UNIT
  }

  public toPrimitives(): RPEPrimitives {
    const value = this._value

    return {
      unit: RPE.DEFAULT_UNIT,
      value,
      normalizedValue: value,
    }
  }
}
