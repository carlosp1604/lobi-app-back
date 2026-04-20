import { Altitude, AltitudeUnit } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Altitude'

export class AltitudeMother {
  public static readonly VALID_METERS = '1000'
  public static readonly VALID_UNIT: AltitudeUnit = 'm'
  public static readonly INVALID_VALUES = ['-12001', '12001', 'NaN', 'Infinity']
  public static readonly INVALID_UNITS = ['cm', 'miles', 'inch', 'unknown', 'invalid']

  static valid(): Altitude {
    return Altitude.fromProps({ value: this.VALID_METERS, unit: this.VALID_UNIT })
  }
}
