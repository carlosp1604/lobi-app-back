import { Speed, SpeedUnit } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Speed'

export class SpeedMother {
  public static readonly VALID_KMH = '16.09344'
  public static readonly VALID_UNIT: SpeedUnit = 'km/h'
  public static readonly INVALID_VALUES = ['-1', '-50', 'NaN', '2001']
  public static readonly INVALID_UNITS = ['m/s', 'knots', 'mph', 'unknown', 'invalid']

  static valid(): Speed {
    return Speed.fromProps({ value: this.VALID_KMH, unit: this.VALID_UNIT })
  }
}
