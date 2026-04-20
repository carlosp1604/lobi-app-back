import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/VisitableMeasurableValueInterface'

export const SupportedAltitudeUnits = ['m', 'ft'] as const
export type AltitudeUnit = (typeof SupportedAltitudeUnits)[number]

export type AltitudeProps = {
  value: BoundedNumber
  unit: AltitudeUnit
  normalizedValue: BoundedNumber
}

export type AltitudeInputProps = {
  value: string
  unit: string
}

export class Altitude
  extends ValueObject<AltitudeProps>
  implements OrderableMagnitudeInterface<Altitude>, VisitableMeasurableValueInterface
{
  private __altitudeBrand: void

  public static readonly DEFAULT_UNIT: AltitudeUnit = 'm'
  public static readonly FT_TO_M_FACTOR = BoundedNumber.fromString('0.3048')
  public static readonly MIN_ALTITUDE = BoundedNumber.fromString('-12000')
  public static readonly MAX_ALTITUDE = BoundedNumber.fromString('12000')

  private constructor(props: AltitudeProps) {
    super(props)
  }

  public static safeCreate(props: AltitudeInputProps): Result<Altitude, SharedDomainException> {
    const unitInput = props.unit.trim().toLowerCase()
    const isSupported = SupportedAltitudeUnits.includes(unitInput as AltitudeUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Altitude', props.unit, [...SupportedAltitudeUnits]))
    }

    const normalizedUnit = unitInput as AltitudeUnit
    const numericResult = BoundedNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(
        SharedDomainException.invalidAltitude(String(props.value), this.MIN_ALTITUDE.numericValue, this.MAX_ALTITUDE.numericValue),
      )
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit === 'ft') {
      normalizedValue = value.multiply(Altitude.FT_TO_M_FACTOR)
    }

    if (normalizedValue.lessThan(Altitude.MIN_ALTITUDE) || normalizedValue.greaterThan(Altitude.MAX_ALTITUDE)) {
      return fail(
        SharedDomainException.invalidAltitude(String(props.value), this.MIN_ALTITUDE.numericValue, this.MAX_ALTITUDE.numericValue),
      )
    }

    return success(new Altitude({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static fromProps(props: AltitudeInputProps): Altitude {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Altitude | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public convertTo(targetUnit: AltitudeUnit): BoundedNumber {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    if (targetUnit === 'ft') {
      return this._value.value.divide(Altitude.FT_TO_M_FACTOR)
    }

    return this._value.value.multiply(Altitude.FT_TO_M_FACTOR)
  }

  public toString(): string {
    return `${this._value.value.numericValue} ${this._value.unit}`
  }

  public isGreaterThan(anotherMagnitude: Altitude): boolean {
    return this._value.normalizedValue.greaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Altitude): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitAltitude(this)
  }
}
