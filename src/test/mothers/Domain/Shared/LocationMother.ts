import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'

export class LocationMother {
  public static readonly VALID_LAT = '40.416775'
  public static readonly VALID_LNG = '-3.70379'
  public static readonly INVALID_LATS = ['-90.0000001', '91', 'NaN', '-100']
  public static readonly INVALID_LNGS = ['-180.0000001', '181', 'NaN', '-200']

  static valid(): Location {
    return Location.fromProps(this.validValues())
  }

  static validValues() {
    return { lat: this.VALID_LAT, lng: this.VALID_LNG }
  }
}
