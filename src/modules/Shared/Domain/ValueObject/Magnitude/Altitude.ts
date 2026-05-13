import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/BoundedNumber'
import { AltitudeConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/AltitudeConverter'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export const SupportedAltitudeUnits = ['m', 'ft'] as const
export type AltitudeUnit = (typeof SupportedAltitudeUnits)[number]

export type AltitudeProps = {
  value: BoundedNumber
  unit: AltitudeUnit
  normalizedValue: BoundedNumber
}

export type AltitudePrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export type AltitudeInputProps = {
  value: string
  unit: string
}

export class Altitude
  extends ValueObject<AltitudeProps>
  implements OrderableMagnitudeInterface<Altitude>, VisitableMagnitudeValueInterface, SerializableInterface<AltitudePrimitives>
{
  private __altitudeBrand: void

  public static readonly DEFAULT_UNIT: AltitudeUnit = 'm'
  public static readonly MIN_ALTITUDE = BoundedNumber.create('-12000')
  public static readonly MAX_ALTITUDE = BoundedNumber.create('12000')

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
      return fail(SharedDomainException.invalidAltitude(props.value, this.MIN_ALTITUDE.stringValue, this.MAX_ALTITUDE.stringValue))
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit === 'ft') {
      normalizedValue = BoundedNumber.create(AltitudeConverter.convert(value.numericValue, normalizedUnit, this.DEFAULT_UNIT).toFixed())
    }

    if (normalizedValue.isLessThan(Altitude.MIN_ALTITUDE) || normalizedValue.isGreaterThan(Altitude.MAX_ALTITUDE)) {
      return fail(SharedDomainException.invalidAltitude(props.value, this.MIN_ALTITUDE.stringValue, this.MAX_ALTITUDE.stringValue))
    }

    return success(new Altitude({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static create(props: AltitudeInputProps): Altitude {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: AltitudePrimitives): Altitude {
    return Altitude.create({ value: primitives.value, unit: primitives.unit })
  }

  public equals(vo?: Altitude | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public toString(): string {
    const { value, unit } = this._value

    return `${value.toString()} ${unit}`
  }

  public toPrimitives(): AltitudePrimitives {
    const { unit, value, normalizedValue } = this._value

    return {
      unit,
      value: value.toPrimitives(),
      normalizedValue: normalizedValue.toPrimitives(),
    }
  }

  public isGreaterThan(anotherMagnitude: Altitude): boolean {
    return this._value.normalizedValue.isGreaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Altitude): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitAltitude(this)
  }

  public get unit(): AltitudeUnit {
    return this._value.unit
  }
}
