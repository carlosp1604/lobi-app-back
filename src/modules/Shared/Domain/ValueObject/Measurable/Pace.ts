import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/VisitableMeasurableValueInterface'

export const SupportedPaceUnits = ['min/km', 'min/mi'] as const
export type PaceUnit = (typeof SupportedPaceUnits)[number]

export type PaceProps = {
  value: BoundedNumber
  unit: PaceUnit
  normalizedValue: BoundedNumber
}

export type PaceInputProps = {
  value: string
  unit: string
}

export class Pace extends ValueObject<PaceProps> implements OrderableMagnitudeInterface<Pace>, VisitableMeasurableValueInterface {
  private __paceBrand: void

  public static readonly DEFAULT_UNIT: PaceUnit = 'min/km'
  public static readonly KM_TO_MI_FACTOR = BoundedNumber.fromString('1.609344')
  public static readonly MIN_PACE = BoundedNumber.fromString('1')
  public static readonly MAX_PACE = BoundedNumber.fromString('86400')

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
      return fail(SharedDomainException.invalidPace(String(props.value), this.MIN_PACE.numericValue, this.MAX_PACE.numericValue))
    }

    const magnitudeValue = numericResult.value
    let normalizedValue = magnitudeValue

    if (normalizedUnit === 'min/mi') {
      normalizedValue = magnitudeValue.divide(Pace.KM_TO_MI_FACTOR)
    }

    if (normalizedValue.lessThan(Pace.MIN_PACE) || normalizedValue.greaterThan(Pace.MAX_PACE)) {
      return fail(SharedDomainException.invalidPace(String(props.value), this.MIN_PACE.numericValue, this.MAX_PACE.numericValue))
    }

    return success(new Pace({ value: magnitudeValue, unit: normalizedUnit, normalizedValue }))
  }

  public static fromProps(props: PaceInputProps): Pace {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Pace | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public convertTo(targetUnit: PaceUnit): BoundedNumber {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    if (targetUnit === 'min/mi') {
      return this._value.value.multiply(Pace.KM_TO_MI_FACTOR)
    }

    return this._value.value.divide(Pace.KM_TO_MI_FACTOR)
  }

  public toString(): string {
    return `${this._value.value.numericValue} ${this._value.unit}`
  }

  public isGreaterThan(anotherMagnitude: Pace): boolean {
    return this._value.normalizedValue.lessThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Pace): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitPace(this)
  }
}
