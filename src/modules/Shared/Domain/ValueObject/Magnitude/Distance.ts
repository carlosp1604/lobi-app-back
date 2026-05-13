import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/BoundedNumber'
import { DistanceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/DistanceConverter'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export const SupportedDistanceUnits = ['m', 'km', 'mi'] as const
export type DistanceUnit = (typeof SupportedDistanceUnits)[number]

export type DistanceProps = {
  value: BoundedNumber
  unit: DistanceUnit
  normalizedValue: BoundedNumber
}

export type DistancePrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export type DistanceInputProps = {
  value: string
  unit: string
}

export class Distance
  extends ValueObject<DistanceProps>
  implements OrderableMagnitudeInterface<Distance>, VisitableMagnitudeValueInterface, SerializableInterface<DistancePrimitives>
{
  private __distanceBrand: void

  public static readonly DEFAULT_UNIT: DistanceUnit = 'm'
  public static readonly MIN_DISTANCE = BoundedNumber.create('0')
  public static readonly MAX_DISTANCE = BoundedNumber.create('25000000')

  private constructor(props: DistanceProps) {
    super(props)
  }

  public static safeCreate(props: DistanceInputProps): Result<Distance, SharedDomainException> {
    const unitInput = props.unit.trim().toLowerCase()
    const isSupported = SupportedDistanceUnits.includes(unitInput as DistanceUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Distance', props.unit, [...SupportedDistanceUnits]))
    }

    const normalizedUnit = unitInput as DistanceUnit
    const numericResult = BoundedNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidDistance(props.value, this.MIN_DISTANCE.stringValue, this.MAX_DISTANCE.stringValue))
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit !== this.DEFAULT_UNIT) {
      normalizedValue = BoundedNumber.create(DistanceConverter.convert(value.numericValue, normalizedUnit, this.DEFAULT_UNIT).toFixed())
    }

    if (normalizedValue.isLessThan(this.MIN_DISTANCE) || normalizedValue.isGreaterThan(this.MAX_DISTANCE)) {
      return fail(SharedDomainException.invalidDistance(props.value, this.MIN_DISTANCE.stringValue, this.MAX_DISTANCE.stringValue))
    }

    return success(new Distance({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static create(props: DistanceInputProps): Distance {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: DistancePrimitives): Distance {
    return Distance.create({ value: primitives.value, unit: primitives.unit })
  }

  public equals(vo?: Distance | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public toString(): string {
    const { value, unit } = this._value

    return `${value.toString()} ${unit}`
  }

  public toPrimitives(): DistancePrimitives {
    const { unit, value, normalizedValue } = this._value

    return {
      unit,
      value: value.toPrimitives(),
      normalizedValue: normalizedValue.toPrimitives(),
    }
  }

  public isGreaterThan(anotherMagnitude: Distance): boolean {
    return this._value.normalizedValue.isGreaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Distance): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitDistance(this)
  }

  public get unit(): DistanceUnit {
    return this._value.unit
  }
}
