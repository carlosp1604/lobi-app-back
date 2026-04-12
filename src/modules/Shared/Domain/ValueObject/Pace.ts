import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { NumericValue } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SupportedPaceUnits = ['min/km', 'min/mi'] as const
export type PaceUnit = (typeof SupportedPaceUnits)[number]

export type PaceProps = {
  value: NumericValue
  unit: PaceUnit
  normalizedValue: NumericValue
}

export type PaceInputProps = {
  value: number
  unit: string
}

export class Pace extends ValueObject<PaceProps> {
  private __paceBrand: void

  public static readonly DEFAULT_UNIT: PaceUnit = 'min/km'
  public static readonly KM_TO_MI_FACTOR = NumericValue.fromValue(1.609344)
  public static readonly MIN_PACE = NumericValue.fromValue(1)
  public static readonly MAX_PACE = NumericValue.fromValue(86400)

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
    const numericResult = NumericValue.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidPace(String(props.value)))
    }

    const magnitudeValue = numericResult.value
    let normalizedValue = magnitudeValue

    if (normalizedUnit === 'min/mi') {
      normalizedValue = magnitudeValue.divide(Pace.KM_TO_MI_FACTOR)
    }

    if (normalizedValue.lessThan(Pace.MIN_PACE) || normalizedValue.greaterThan(Pace.MAX_PACE)) {
      return fail(SharedDomainException.invalidPace(String(props.value)))
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

  private static formatFromSeconds(magnitude: NumericValue, withMillis: boolean = false): string {
    const totalSeconds = withMillis ? magnitude.round(3) : magnitude.round(0)
    const absoluteSeconds = Math.abs(totalSeconds)

    const minutes = Math.floor(absoluteSeconds / 60)
    const seconds = Math.floor(absoluteSeconds % 60)

    let formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    if (withMillis) {
      const fraction = (absoluteSeconds % 1).toFixed(3).split('.')[1] || '000'
      formatted += `.${fraction}`
    }

    return magnitude.numericValue < 0 ? `-${formatted}` : formatted
  }

  public convertTo(targetUnit: PaceUnit): NumericValue {
    if (this._value.unit === targetUnit) {
      return this._value.value
    }

    return targetUnit === 'min/mi' ? this._value.value.multiply(Pace.KM_TO_MI_FACTOR) : this._value.value.divide(Pace.KM_TO_MI_FACTOR)
  }

  public toDTO() {
    const paceInKm = this.convertTo('min/km')
    const paceInMi = this.convertTo('min/mi')

    return {
      value: paceInKm.numericValue,
      unit: 'min/km',
      conversions: {
        'min/km': paceInKm.round(3),
        'min/mi': paceInMi.round(3),
      },
      formatted: {
        'min/km': {
          long: `${Pace.formatFromSeconds(paceInKm, true)} min/km`,
          short: `${Pace.formatFromSeconds(paceInKm)} min/km`,
        },
        'min/mi': {
          long: `${Pace.formatFromSeconds(paceInMi, true)} min/mi`,
          short: `${Pace.formatFromSeconds(paceInMi)} min/mi`,
        },
      },
    }
  }

  public toString(): string {
    return `${Pace.formatFromSeconds(this._value.value)} ${this._value.unit}`
  }

  public static getConfiguration() {
    return {
      defaultUnit: this.DEFAULT_UNIT,
      min: this.MIN_PACE.numericValue,
      max: this.MAX_PACE.numericValue,
      units: SupportedPaceUnits,
    }
  }
}
