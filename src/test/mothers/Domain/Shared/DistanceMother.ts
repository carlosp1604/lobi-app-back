import { Distance, DistanceUnit, SupportedDistanceUnits } from '~/src/modules/Shared/Domain/ValueObject/Distance'

export class DistanceMother {
  public static readonly VALID_METERS = 5000
  public static readonly VALID_KILOMETERS = 5
  public static readonly VALID_UNIT = 'm'

  public static readonly INVALID_VALUES = [0, -1, -500, NaN]
  public static readonly INVALID_UNITS = ['cm', 'miles', 'inch', 'unknown']

  static valid(): Distance {
    return Distance.fromProps({ value: this.VALID_METERS, unit: this.VALID_UNIT })
  }

  static validMetersValue(): { value: number; unit: DistanceUnit; expectedMeters: number } {
    return {
      value: this.VALID_METERS,
      unit: 'm',
      expectedMeters: this.VALID_METERS,
    }
  }

  static validKmValue(): { value: number; unit: DistanceUnit; expectedMeters: number } {
    return {
      value: this.VALID_KILOMETERS,
      unit: 'km',
      expectedMeters: this.VALID_METERS,
    }
  }

  static randomValues(): { value: number; unit: DistanceUnit } {
    const units = [...SupportedDistanceUnits]
    const randomUnit = units[Math.floor(Math.random() * units.length)]

    const randomValue = Math.floor(Math.random() * 100) + 1

    return {
      value: randomValue,
      unit: randomUnit,
    }
  }
}
