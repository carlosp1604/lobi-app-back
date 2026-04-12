import { Altitude, AltitudeUnit } from '~/src/modules/Shared/Domain/ValueObject/Altitude'
import { NumberPrecision } from '~/src/modules/Shared/Domain/NumberPrecision'

export interface AltitudeMotherValidValue {
  value: number
  unit: AltitudeUnit
  conversions: {
    [k in AltitudeUnit]: number
  }
  formatted: {
    [k in AltitudeUnit]: string
  }
}

export class AltitudeMother {
  public static readonly VALID_METERS = 1000
  public static readonly VALID_FEET = 1131
  public static readonly VALID_UNIT = 'm'

  public static readonly INVALID_VALUES = [NaN]
  public static readonly INVALID_UNITS = ['cm', 'miles', 'inch', 'unknown']

  static valid(): Altitude {
    return Altitude.fromProps({ value: this.VALID_METERS, unit: this.VALID_UNIT })
  }

  static validMetersValue(): AltitudeMotherValidValue {
    const expectedMtoFtConversion = 3280.8399
    return {
      value: this.VALID_METERS,
      unit: 'm',
      conversions: {
        m: this.VALID_METERS,
        ft: expectedMtoFtConversion,
      },
      formatted: {
        m: `${this.VALID_METERS} m`,
        ft: `${expectedMtoFtConversion} ft`,
      },
    }
  }

  static validFtValue(): AltitudeMotherValidValue {
    const expectedFtToMConversion = 344.7288
    return {
      value: expectedFtToMConversion,
      unit: 'm',
      conversions: {
        m: expectedFtToMConversion,
        ft: this.VALID_FEET,
      },
      formatted: {
        m: `${expectedFtToMConversion} m`,
        ft: `${this.VALID_FEET} ft`,
      },
    }
  }

  static randomAltitudes(): number {
    return NumberPrecision.format(Math.floor(Math.random() * 10000) - 1000)
  }
}
