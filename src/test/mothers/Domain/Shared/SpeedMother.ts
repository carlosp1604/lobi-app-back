import { Speed, SpeedUnit, SupportedSpeedUnits } from '~/src/modules/Shared/Domain/ValueObject/Speed'

export class SpeedMother {
  public static readonly VALID_MPH = 10
  public static readonly VALID_KMH = 16.0934 // 10 * 1.60934
  public static readonly VALID_UNIT = 'km/h'

  public static readonly INVALID_VALUES = [-1, -50, NaN]
  public static readonly INVALID_UNITS = ['m/s', 'knots', 'mph', 'unknown']

  static valid(): Speed {
    return Speed.fromProps({ value: this.VALID_KMH, unit: this.VALID_UNIT })
  }

  static validKmhValue(): { value: number; unit: SpeedUnit; expectedKmh: number } {
    return {
      value: this.VALID_KMH,
      unit: 'km/h',
      expectedKmh: this.VALID_KMH,
    }
  }

  static validMphValue(): { value: number; unit: SpeedUnit; expectedKmh: number } {
    return {
      value: this.VALID_MPH,
      unit: 'mi/h',
      expectedKmh: this.VALID_KMH,
    }
  }

  static randomValues(): { value: number; unit: SpeedUnit } {
    const units = [...SupportedSpeedUnits]
    const randomUnit = units[Math.floor(Math.random() * units.length)]

    const randomValue = Math.floor(Math.random() * 100)

    return {
      value: randomValue,
      unit: randomUnit,
    }
  }
}
