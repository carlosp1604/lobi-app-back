import { Distance, DistanceUnit } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Distance'

export class DistanceMother {
  public static readonly VALID_METERS = '1609.344'
  public static readonly VALID_UNIT: DistanceUnit = 'm'
  public static readonly INVALID_VALUES = ['-1', '-500', 'NaN', '25000001']
  public static readonly INVALID_UNITS = ['cm', 'miles', 'inch', 'unknown', 'invalid']

  static valid(): Distance {
    return Distance.fromProps({ value: this.VALID_METERS, unit: this.VALID_UNIT })
  }
}
