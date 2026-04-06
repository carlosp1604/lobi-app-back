import { Time } from '~/src/modules/Shared/Domain/ValueObject/Time'

export class TimeMother {
  public static readonly VALID_SECONDS = 3665
  public static readonly VALID_STRING = '01:01:05'

  public static readonly VALID_SHORT_SECONDS = 2730
  public static readonly VALID_SHORT_STRING = '45:30'

  public static readonly INVALID_FORMAT_CASES = ['', 'abc', '12:60', '24:15:70', '-05:00', '00:00', '00:00:00']

  public static readonly INVALID_SECONDS = [0, -1, -500, NaN]

  static valid(): Time {
    return Time.fromSeconds(this.VALID_SECONDS)
  }

  static validValue(): { formatted: string; expectedSeconds: number } {
    return {
      formatted: this.VALID_STRING,
      expectedSeconds: this.VALID_SECONDS,
    }
  }

  static validShortValue(): { formatted: string; expectedSeconds: number } {
    return {
      formatted: this.VALID_SHORT_STRING,
      expectedSeconds: this.VALID_SHORT_SECONDS,
    }
  }

  static randomValues(): { formatted: string; seconds: number } {
    const hasHours = Math.random() > 0.5

    const h = hasHours ? Math.floor(Math.random() * 10) + 1 : 0
    const m = Math.floor(Math.random() * 60)
    const s = Math.floor(Math.random() * 59) + 1

    const totalSeconds = h * 3600 + m * 60 + s

    const mStr = m.toString().padStart(2, '0')
    const sStr = s.toString().padStart(2, '0')

    const formatted = h > 0 ? `${h.toString().padStart(2, '0')}:${mStr}:${sStr}` : `${mStr}:${sStr}`

    return {
      formatted,
      seconds: totalSeconds,
    }
  }

  static randomSeconds(): number {
    return Math.floor(Math.random() * 36000) + 1
  }
}
