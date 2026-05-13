import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/BoundedNumber'
import { PaceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/PaceConverter'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export const SupportedPaceUnits = ['min/km', 'min/mi'] as const
export type PaceUnit = (typeof SupportedPaceUnits)[number]

export type PaceProps = {
  value: BoundedNumber
  unit: PaceUnit
  normalizedValue: BoundedNumber
}

export type PacePrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export type PaceInputProps = {
  value: string
  unit: string
}

export class Pace
  extends ValueObject<PaceProps>
  implements OrderableMagnitudeInterface<Pace>, VisitableMagnitudeValueInterface, SerializableInterface<PacePrimitives>
{
  private __paceBrand: void

  public static readonly DEFAULT_UNIT: PaceUnit = 'min/km'
  public static readonly MIN_PACE = BoundedNumber.create('1')
  public static readonly MAX_PACE = BoundedNumber.create('86400')

  private constructor(props: PaceProps) {
    super(props)
  }

  public static safeCreate(props: PaceInputProps): Result<Pace, SharedDomainException> {
    const unitInput = props.unit.trim().toLowerCase()
    const isSupported = SupportedPaceUnits.includes(unitInput as PaceUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Pace', props.unit, [...SupportedPaceUnits]))
    }

    const normalizedUnit = unitInput as PaceUnit
    const numericResult = BoundedNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidPace(props.value, this.MIN_PACE.stringValue, this.MAX_PACE.stringValue))
    }

    const magnitudeValue = numericResult.value
    let normalizedValue = magnitudeValue

    if (normalizedUnit !== this.DEFAULT_UNIT) {
      normalizedValue = BoundedNumber.create(
        PaceConverter.convert(magnitudeValue.numericValue, normalizedUnit, this.DEFAULT_UNIT).toFixed(),
      )
    }

    if (normalizedValue.isLessThan(this.MIN_PACE) || normalizedValue.isGreaterThan(this.MAX_PACE)) {
      return fail(SharedDomainException.invalidPace(props.value, this.MIN_PACE.stringValue, this.MAX_PACE.stringValue))
    }

    return success(new Pace({ value: magnitudeValue, unit: normalizedUnit, normalizedValue }))
  }

  public static create(props: PaceInputProps): Pace {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: PacePrimitives): Pace {
    return Pace.create({ value: primitives.value, unit: primitives.unit })
  }

  public equals(vo?: Pace | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public toString(): string {
    const { value, unit } = this._value

    return `${value.toString()} ${unit}`
  }

  public toPrimitives(): PacePrimitives {
    const { unit, value, normalizedValue } = this._value

    return {
      unit,
      value: value.toPrimitives(),
      normalizedValue: normalizedValue.toPrimitives(),
    }
  }

  public isGreaterThan(anotherMagnitude: Pace): boolean {
    return this._value.normalizedValue.isLessThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Pace): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitPace(this)
  }

  public get unit(): PaceUnit {
    return this._value.unit
  }
}
