import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { NumberPrecision } from '~/src/modules/Shared/Domain/NumberPrecision'

export const SupportedAltitudeUnits = ['m', 'ft'] as const
export type AltitudeUnit = (typeof SupportedAltitudeUnits)[number]

export type AltitudeProps = {
  value: number
  unit: AltitudeUnit
}

export class Altitude extends ValueObject<AltitudeProps> {
  private __altitudeBrand: void

  public static readonly M_TO_FT_CONVERSION = 0.3048
  public static readonly DEFAULT_UNIT = 'm'

  private constructor(props: AltitudeProps) {
    super(props)
  }

  public static safeCreate(props: { value: number; unit: string }): Result<Altitude, SharedDomainException> {
    const normalizedUnit = props.unit.trim().toLowerCase() as AltitudeUnit

    if (!SupportedAltitudeUnits.includes(normalizedUnit)) {
      return fail(SharedDomainException.invalidUnit('Altitude', props.unit, [...SupportedAltitudeUnits]))
    }

    if (isNaN(props.value)) {
      return fail(SharedDomainException.invalidAltitude(String(props.value)))
    }

    const rawMeters = normalizedUnit === 'ft' ? props.value * this.M_TO_FT_CONVERSION : props.value
    const meters = NumberPrecision.format(rawMeters)

    return success(new Altitude({ value: meters, unit: this.DEFAULT_UNIT }))
  }

  public static fromProps(props: { value: number; unit: string }): Altitude {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Altitude | null): boolean {
    if (vo === null || vo === undefined || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.value === vo._value.value
  }

  public toString(): string {
    return `${this._value.value} ${this._value.unit}`
  }

  public toDTO() {
    const feet = NumberPrecision.round(this._value.value / Altitude.M_TO_FT_CONVERSION, 4)
    const meters = NumberPrecision.round(this._value.value, 4)

    return {
      value: meters,
      unit: this._value.unit,
      conversions: {
        m: meters,
        ft: feet,
      },
      formatted: {
        m: `${meters} m`,
        ft: `${feet} ft`,
      },
    }
  }
}
