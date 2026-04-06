import { Pace, PaceUnit, SupportedPaceUnits } from '~/src/modules/Shared/Domain/ValueObject/Pace'

export class PaceMother {
  public static readonly VALID_SECONDS = 330
  public static readonly VALID_STRING = '05:30'
  public static readonly VALID_UNIT: PaceUnit = 'min/km'

  public static readonly VALID_MI_STRING = '08:51'

  public static readonly INVALID_FORMAT_CASES = ['', '05:60', '05:3', '--:--', 'abc', '00:00', '-05:30']
  public static readonly INVALID_UNITS = ['km/h', 'meters', 'seconds', 'unknown']

  public static readonly INVALID_SECONDS = [0, -1, -500, NaN]

  static valid(): Pace {
    return Pace.fromSeconds(this.VALID_SECONDS, this.VALID_UNIT)
  }

  static validMiValue(): { value: string; unit: PaceUnit; expectedSeconds: number } {
    return {
      value: this.VALID_MI_STRING,
      unit: 'min/mi',
      expectedSeconds: Math.round(this.VALID_SECONDS * Pace.MIN_KM_TO_MIN_MI_CONVERSION),
    }
  }

  static validKmValue(): { value: string; unit: PaceUnit; expectedSeconds: number } {
    return {
      value: this.VALID_STRING,
      unit: 'min/km',
      expectedSeconds: this.VALID_SECONDS,
    }
  }

  static randomValues(): { value: string; unit: PaceUnit } {
    const reasonableMinutesRange = [3, 4, 5, 6]
    const minSeconds = 0
    const maxSeconds = 59

    const randomMinute = reasonableMinutesRange[Math.floor(Math.random() * reasonableMinutesRange.length)]
    const randomSecond = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
    const randomUnit = SupportedPaceUnits[Math.floor(Math.random() * SupportedPaceUnits.length)]

    const formattedValue = `${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')}`

    return {
      value: formattedValue,
      unit: randomUnit,
    }
  }

  static randomSeconds(): number {
    const reasonableMinutesRange = [3, 4, 5, 6]
    const minSeconds = 0
    const maxSeconds = 59

    const randomMinute = reasonableMinutesRange[Math.floor(Math.random() * reasonableMinutesRange.length)]
    const randomSecond = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds

    return randomMinute * 60 + randomSecond
  }
}
