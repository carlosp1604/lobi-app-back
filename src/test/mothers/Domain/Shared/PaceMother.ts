import { Pace, PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Pace'

export class PaceMother {
  public static readonly VALID_UNIT: PaceUnit = 'min/km'
  public static readonly VALID_MIN_KM_SECONDS = '330'

  public static readonly INVALID_UNITS = ['km/h', 'meters', 'seconds', 'unknown']
  public static readonly INVALID_SECONDS = [0, -1, -500, NaN]

  static valid(): Pace {
    return Pace.fromProps({ value: this.VALID_MIN_KM_SECONDS, unit: this.VALID_UNIT })
  }
}
