import { Pace, PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Pace'
import { NumberPrecision } from '~/src/modules/Shared/Domain/NumberPrecision'

export interface PaceMotherValidValue {
  formatted: {
    [k in PaceUnit]: {
      short: string
      long: string
    }
  }
  value: number
  unit: PaceUnit
  conversions: {
    [k in PaceUnit]: {
      short: number
      long: number
    }
  }
}

export class PaceMother {
  public static readonly VALID_UNIT: PaceUnit = 'min/km'

  public static readonly VALID_MIN_KM_SECONDS = 330

  public static readonly INVALID_UNITS = ['km/h', 'meters', 'seconds', 'unknown']
  public static readonly INVALID_SECONDS = [0, -1, -500, NaN]

  static valid(): Pace {
    return Pace.fromProps({ value: this.VALID_MIN_KM_SECONDS, unit: this.VALID_UNIT })
  }

  static validMinMiValue(): PaceMotherValidValue {
    const expectedMinMitoMinKmRoundedConversion = 329.948
    const expectedMinMitoMinKmConversion = 329.94810307

    return {
      value: 531,
      unit: 'min/mi',
      conversions: {
        'min/mi': {
          short: 531,
          long: 531,
        },
        'min/km': {
          short: expectedMinMitoMinKmRoundedConversion,
          long: expectedMinMitoMinKmConversion,
        },
      },
      formatted: {
        'min/mi': {
          short: '08:51 min/mi',
          long: '08:51.000 min/mi',
        },
        'min/km': {
          short: '05:30 min/km',
          long: '05:29.948 min/km',
        },
      },
    }
  }

  static validMinKmValue(): PaceMotherValidValue {
    const expectedMinKmToMinMiRoundedConversion = 531.082
    const expectedMinKmToMinMiConversion = 531.08219999
    return {
      value: 330,
      unit: 'min/km',
      conversions: {
        'min/km': {
          long: 330,
          short: 330,
        },
        'min/mi': {
          long: expectedMinKmToMinMiConversion,
          short: expectedMinKmToMinMiRoundedConversion,
        },
      },
      formatted: {
        'min/km': {
          short: '05:30 min/km',
          long: '05:30.000 min/km',
        },
        'min/mi': {
          short: '08:51 min/mi',
          long: '08:51.082 min/mi',
        },
      },
    }
  }

  static randomSeconds(): number {
    const reasonableMinutesRange = [3, 4, 5, 6]
    const minSeconds = 0
    const maxSeconds = 59

    const randomMinute = reasonableMinutesRange[Math.floor(Math.random() * reasonableMinutesRange.length)]

    const randomSecond = NumberPrecision.format(Math.random() * (maxSeconds - minSeconds + 1), 8)

    return NumberPrecision.format(randomMinute * 60 + randomSecond)
  }
}
