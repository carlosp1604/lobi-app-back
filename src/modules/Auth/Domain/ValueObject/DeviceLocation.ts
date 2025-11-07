import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export interface DeviceLocationProps {
  city: string
  countryCode: string
}

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/

export class DeviceLocation extends ValueObject<DeviceLocationProps> {
  private __deviceLocationBrand: void

  private constructor(props: DeviceLocationProps) {
    super(props)
  }

  public static fromProps(props: DeviceLocationProps): DeviceLocation {
    const normalizedCity = props.city.trim()
    const normalizedCountryCode = props.countryCode.trim().toUpperCase()

    if (!this.isValidCity(normalizedCity)) {
      throw UserSessionDomainException.invalidDeviceCity(normalizedCity)
    }

    if (!this.isValidCountryCode(normalizedCountryCode)) {
      throw UserSessionDomainException.invalidDeviceCountryCode(normalizedCountryCode)
    }

    return new DeviceLocation({
      city: normalizedCity,
      countryCode: normalizedCountryCode,
    })
  }

  get city(): string {
    return this.value.city
  }

  get countryCode(): string {
    return this.value.countryCode
  }

  public equals(vo?: DeviceLocation | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this.value.city === vo.value.city && this.value.countryCode === vo.value.countryCode
  }

  private static isValidCountryCode(countryCode: DeviceLocationProps['countryCode']): boolean {
    return COUNTRY_CODE_REGEX.test(countryCode)
  }

  private static isValidCity(city: DeviceLocationProps['city']): boolean {
    return city !== ''
  }
}
