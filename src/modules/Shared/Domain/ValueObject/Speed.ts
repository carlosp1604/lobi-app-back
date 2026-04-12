import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { NumericValue } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SupportedSpeedUnits = ['km/h', 'mi/h'] as const
export type SpeedUnit = (typeof SupportedSpeedUnits)[number]

export type SpeedProps = {
  value: NumericValue
  unit: SpeedUnit
  normalizedValue: NumericValue
}

export type SpeedInputProps = {
  value: number
  unit: string
}

export class Speed extends ValueObject<SpeedProps> {
  private __speedBrand: void

  public static readonly DEFAULT_UNIT: SpeedUnit = 'km/h'
  public static readonly KM_TO_MI_FACTOR = NumericValue.fromValue(1.609344)
  public static readonly MIN_SPEED = NumericValue.fromValue(0)
  public static readonly MAX_SPEED = NumericValue.fromValue(2000)

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
    const numericResult = NumericValue.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidSpeed(String(props.value)))
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit === 'mi/h') {
      normalizedValue = value.multiply(Speed.KM_TO_MI_FACTOR)
    }

    if (normalizedValue.lessThan(Speed.MIN_SPEED) || normalizedValue.greaterThan(Speed.MAX_SPEED)) {
      return fail(SharedDomainException.invalidSpeed(String(props.value)))
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

  public convertTo(targetUnit: SpeedUnit): NumericValue {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    return targetUnit === 'mi/h' ? this._value.value.divide(Speed.KM_TO_MI_FACTOR) : this._value.value.multiply(Speed.KM_TO_MI_FACTOR)
  }

  public toDTO() {
    const speedInKmh = this.convertTo('km/h')
    const speedInMph = this.convertTo('mi/h')

    return {
      value: speedInKmh.numericValue,
      unit: Speed.DEFAULT_UNIT,
      conversions: {
        'km/h': speedInKmh.round(2),
        'mi/h': speedInMph.round(2),
      },
      formatted: {
        'km/h': `${speedInKmh.round(2)} km/h`,
        'mi/h': `${speedInMph.round(2)} mi/h`,
      },
    }
  }

  public toString(): string {
    return `${this._value.value.truncate(2)} ${this._value.unit}`
  }

  public static getConfiguration() {
    return {
      defaultUnit: this.DEFAULT_UNIT,
      min: this.MIN_SPEED.numericValue,
      max: this.MAX_SPEED.numericValue,
      units: SupportedSpeedUnits,
    }
  }
}
