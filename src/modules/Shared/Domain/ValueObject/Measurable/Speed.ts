import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export const SupportedSpeedUnits = ['km/h', 'mi/h'] as const
export type SpeedUnit = (typeof SupportedSpeedUnits)[number]

export type SpeedProps = {
  value: BoundedNumber
  unit: SpeedUnit
  normalizedValue: BoundedNumber
}

export type SpeedInputProps = {
  value: string
  unit: string
}

export class Speed extends ValueObject<SpeedProps> implements OrderableMagnitudeInterface<Speed>, VisitableMeasurableValueInterface {
  private __speedBrand: void

  public static readonly DEFAULT_UNIT: SpeedUnit = 'km/h'
  public static readonly KM_TO_MI_FACTOR = BoundedNumber.fromString('1.609344')
  public static readonly MIN_SPEED = BoundedNumber.fromString('0')
  public static readonly MAX_SPEED = BoundedNumber.fromString('2000')

  private constructor(props: SpeedProps) {
    super(props)
  }

  public static safeCreate(props: SpeedInputProps): Result<Speed, SharedDomainException> {
    const unitInput = props.unit.trim().toLowerCase()
    const isSupported = SupportedSpeedUnits.includes(unitInput as SpeedUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Speed', props.unit, [...SupportedSpeedUnits]))
    }

    const normalizedUnit = unitInput as SpeedUnit
    const numericResult = BoundedNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidSpeed(String(props.value), this.MIN_SPEED.numericValue, this.MAX_SPEED.numericValue))
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit === 'mi/h') {
      normalizedValue = value.multiply(Speed.KM_TO_MI_FACTOR)
    }

    if (normalizedValue.lessThan(Speed.MIN_SPEED) || normalizedValue.greaterThan(Speed.MAX_SPEED)) {
      return fail(SharedDomainException.invalidSpeed(String(props.value), this.MIN_SPEED.numericValue, this.MAX_SPEED.numericValue))
    }

    return success(new Speed({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static fromProps(props: SpeedInputProps): Speed {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Speed | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public convertTo(targetUnit: SpeedUnit): BoundedNumber {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    if (targetUnit === 'mi/h') {
      return this._value.value.divide(Speed.KM_TO_MI_FACTOR)
    }

    return this._value.value.multiply(Speed.KM_TO_MI_FACTOR)
  }

  public toString(): string {
    return `${this._value.value.numericValue} ${this._value.unit}`
  }

  public isGreaterThan(anotherMagnitude: Speed): boolean {
    return this._value.normalizedValue.greaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Speed): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitSpeed(this)
  }
}
