import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { success, fail, Result } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export const SupportedPaceUnits = ['min/km', 'min/mi'] as const
export type PaceUnit = (typeof SupportedPaceUnits)[number]

export type PaceProps = {
  value: number
  unit: PaceUnit
}

export class Pace extends ValueObject<PaceProps> {
  private __paceBrand: void

  public static readonly REGEX = /^([0-9]{1,3}):([0-5][0-9])$/
  public static readonly MIN_KM_TO_MIN_MI_CONVERSION = 1.60934

  private constructor(props: PaceProps) {
    super(props)
  }

  public static safeCreateFromProps(props: { value: string; unit: string }): Result<Pace, SharedDomainException> {
    const normalizedUnit = props.unit.trim().toLowerCase() as PaceUnit

    if (!SupportedPaceUnits.includes(normalizedUnit)) {
      return fail(SharedDomainException.invalidUnit('Pace', props.unit, [...SupportedPaceUnits]))
    }

    const paceValue = props.value.trim()
    const match = paceValue.match(this.REGEX)

    if (!match) {
      return fail(SharedDomainException.invalidPace(paceValue))
    }

    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const totalSeconds = minutes * 60 + seconds

    if (totalSeconds <= 0) {
      return fail(SharedDomainException.invalidPace(paceValue))
    }

    const secondsPerKm = normalizedUnit === 'min/mi' ? Math.round(totalSeconds / this.MIN_KM_TO_MIN_MI_CONVERSION) : totalSeconds

    return success(new Pace({ value: secondsPerKm, unit: 'min/km' }))
  }

  public static fromProps(props: { value: string; unit: string }): Pace {
    const result = this.safeCreateFromProps(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static safeCreateFromSeconds(seconds: number, unit: string): Result<Pace, SharedDomainException> {
    const normalizedUnit = unit.trim().toLowerCase() as PaceUnit

    if (!SupportedPaceUnits.includes(normalizedUnit)) {
      return fail(SharedDomainException.invalidUnit('Pace', unit, [...SupportedPaceUnits]))
    }

    if (isNaN(seconds) || seconds <= 0) {
      return fail(SharedDomainException.invalidPace(String(seconds)))
    }

    const normalizedSeconds = normalizedUnit === 'min/mi' ? Math.round(seconds / Pace.MIN_KM_TO_MIN_MI_CONVERSION) : seconds

    return success(new Pace({ value: normalizedSeconds, unit: 'min/km' }))
  }

  public static fromSeconds(seconds: number, unit: string): Pace {
    const result = this.safeCreateFromSeconds(seconds, unit)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Pace | null): boolean {
    if (vo === null || vo === undefined || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.value === vo._value.value
  }

  public toString(): string {
    return `${Pace.formatFromSeconds(this._value.value)} ${this._value.unit}`
  }

  public toDTO() {
    const secondsPerMi = Math.round(this._value.value * Pace.MIN_KM_TO_MIN_MI_CONVERSION)

    return {
      value: Pace.formatFromSeconds(this._value.value),
      unit: this._value.unit,
      seconds: this._value.value,
      conversions: {
        'min/km': Pace.formatFromSeconds(this._value.value),
        'min/mi': Pace.formatFromSeconds(secondsPerMi),
      },
    }
  }

  private static formatFromSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}
