import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export const SupportedDistanceUnits = ['m', 'km', 'mi'] as const
export type DistanceUnit = (typeof SupportedDistanceUnits)[number]

export type DistanceProps = {
  value: BoundedNumber
  unit: DistanceUnit
  normalizedValue: BoundedNumber
}

export type DistanceInputProps = {
  value: string
  unit: string
}

export class Distance
  extends ValueObject<DistanceProps>
  implements OrderableMagnitudeInterface<Distance>, VisitableMeasurableValueInterface
{
  private __distanceBrand: void

  public static readonly DEFAULT_UNIT: DistanceUnit = 'm'
  public static readonly KM_TO_M_FACTOR = BoundedNumber.fromString('1000')
  public static readonly MI_TO_M_FACTOR = BoundedNumber.fromString('1609.344')
  public static readonly MIN_DISTANCE = BoundedNumber.fromString('0')
  public static readonly MAX_DISTANCE = BoundedNumber.fromString('25000000')

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
      return fail(
        SharedDomainException.invalidDistance(
          String(props.value),
          Distance.MIN_DISTANCE.numericValue,
          Distance.MAX_DISTANCE.numericValue,
        ),
      )
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit === 'km') {
      normalizedValue = value.multiply(Distance.KM_TO_M_FACTOR)
    } else if (normalizedUnit === 'mi') {
      normalizedValue = value.multiply(Distance.MI_TO_M_FACTOR)
    }

    if (normalizedValue.lessThan(Distance.MIN_DISTANCE) || normalizedValue.greaterThan(Distance.MAX_DISTANCE)) {
      return fail(
        SharedDomainException.invalidDistance(
          String(props.value),
          Distance.MIN_DISTANCE.numericValue,
          Distance.MAX_DISTANCE.numericValue,
        ),
      )
    }

    return success(new Distance({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static fromProps(props: DistanceInputProps): Distance {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Distance | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public convertTo(targetUnit: DistanceUnit): BoundedNumber {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    if (targetUnit === 'm') {
      return this._value.normalizedValue
    }

    if (targetUnit === 'km') {
      return this._value.normalizedValue.divide(Distance.KM_TO_M_FACTOR)
    }

    return this._value.normalizedValue.divide(Distance.MI_TO_M_FACTOR)
  }

  public toString(): string {
    return `${this._value.value.numericValue} ${this._value.unit}`
  }

  public isGreaterThan(anotherMagnitude: Distance): boolean {
    return this._value.normalizedValue.greaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Distance): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitDistance(this)
  }
}
