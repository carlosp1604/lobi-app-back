import { Speed, SpeedUnit } from '~/src/modules/Shared/Domain/ValueObject/Speed'
import { NumberPrecision } from '~/src/modules/Shared/Domain/NumberPrecision'

export interface SpeedMotherValidValue {
  value: number
  unit: SpeedUnit
  conversions: {
    [k in SpeedUnit]: {
      short: number
      long: number
    }
  }
  formatted: {
    [k in SpeedUnit]: string
  }
}

export class SpeedMother {
  public static readonly VALID_KMH = 16.0934

  public static readonly VALID_UNIT: SpeedUnit = 'km/h'

  public static readonly INVALID_VALUES = [-1, -50, NaN, 2001]
  public static readonly INVALID_UNITS = ['m/s', 'knots', 'mph', 'unknown', 'invalid']

  static valid(): Speed {
    return Speed.fromProps({ value: this.VALID_KMH, unit: this.VALID_UNIT })
  }

  static validKmhValue(): SpeedMotherValidValue {
    return {
      value: 16.09344,
      unit: 'km/h',
      conversions: {
        'km/h': {
          short: 16.09,
          long: 16.09344,
        },
        'mi/h': {
          short: 10,
          long: 10,
        },
      },
      formatted: {
        'km/h': '16.09 km/h',
        'mi/h': '10 mi/h',
      },
    }
  }

  static validMphValue(): SpeedMotherValidValue {
    return {
      value: 10,
      unit: 'mi/h',
      conversions: {
        'km/h': {
          short: 16.09,
          long: 16.09344,
        },
        'mi/h': {
          short: 10,
          long: 10,
        },
      },
      formatted: {
        'km/h': '16.09 km/h',
        'mi/h': '10 mi/h',
      },
    }
  }

  static randomSpeed(): number {
    return NumberPrecision.format(Math.random() * 100, 8)
  }
}
