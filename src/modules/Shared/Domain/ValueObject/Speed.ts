import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SupportedSpeedUnits = ['km/h', 'mi/h'] as const
export type SpeedUnit = (typeof SupportedSpeedUnits)[number]

export type SpeedProps = {
  value: number
  unit: SpeedUnit
}

export class Speed extends ValueObject<SpeedProps> {
  private __speedBrand: void

  public static readonly KM_TO_MI_CONVERSION = 1.60934

  private constructor(props: SpeedProps) {
    super(props)
  }

  public static safeCreate(props: { value: number; unit: string }): Result<Speed, SharedDomainException> {
    const normalizedUnit = props.unit.trim().toLowerCase() as SpeedUnit

    if (!SupportedSpeedUnits.includes(normalizedUnit)) {
      return fail(SharedDomainException.invalidUnit('Speed', props.unit, [...SupportedSpeedUnits]))
    }

    if (isNaN(props.value) || props.value < 0) {
      return fail(SharedDomainException.invalidSpeed(String(props.value)))
    }

    const kmh = normalizedUnit === 'mi/h' ? props.value * this.KM_TO_MI_CONVERSION : props.value

    return success(new Speed({ value: kmh, unit: 'km/h' }))
  }

  public static fromProps(props: { value: number; unit: string }): Speed {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Speed | null): boolean {
    if (vo === null || vo === undefined || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.value === vo._value.value
  }

  public toString(): string {
    return `${this._value.value} ${this._value.unit}`
  }

  public toDTO() {
    const mph = this._value.value / Speed.KM_TO_MI_CONVERSION

    return {
      value: this._value.value,
      unit: this._value.unit,
      conversions: {
        'km/h': this._value.value,
        'mi/h': mph,
      },
    }
  }
}
