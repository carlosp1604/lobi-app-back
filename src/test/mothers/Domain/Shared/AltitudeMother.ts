import { Altitude, AltitudeUnit, SupportedAltitudeUnits } from '~/src/modules/Shared/Domain/ValueObject/Altitude'

export class AltitudeMother {
  public static readonly VALID_METERS = 3048
  public static readonly VALID_FEET = 10000
  public static readonly VALID_UNIT = 'm'

  public static readonly INVALID_VALUES = [NaN]
  public static readonly INVALID_UNITS = ['cm', 'miles', 'inch', 'unknown']

  static valid(): Altitude {
    return Altitude.fromProps({ value: this.VALID_METERS, unit: this.VALID_UNIT })
  }

  static validMetersValue(): { value: number; unit: AltitudeUnit; expectedMeters: number } {
    return {
      value: this.VALID_METERS,
      unit: 'm',
      expectedMeters: this.VALID_METERS,
    }
  }

  static validFtValue(): { value: number; unit: AltitudeUnit; expectedMeters: number } {
    return {
      value: this.VALID_FEET,
      unit: 'ft',
      expectedMeters: this.VALID_METERS,
    }
  }

  static randomValues(): { value: number; unit: AltitudeUnit } {
    const units = [...SupportedAltitudeUnits]
    const randomUnit = units[Math.floor(Math.random() * units.length)]

    const randomValue = Math.floor(Math.random() * 10000) - 1000

    return {
      value: randomValue,
      unit: randomUnit,
    }
  }
}
