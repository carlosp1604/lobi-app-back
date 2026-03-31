import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class UserSessionDomainException extends DomainException {
  public readonly __brand = 'UserSessionDomainException' as const

  public static invalidUserSessionTokenHashId = 'user_session_domain_invalid_user_session_token_hash'
  public static invalidDeviceCountryCodeId = 'user_session_domain_invalid_device_country_code'
  public static invalidDeviceCityId = 'user_session_domain_invalid_device_city'
  public static invalidDeviceInfoId = 'user_session_domain_invalid_device_info'
  public static sessionAlreadyRevokedId = 'user_session_domain_session_already_revoked'
  public static sessionAlreadyExpiredId = 'user_session_domain_session_already_expired'

  private constructor(message: string, id: string) {
    super(message, id, UserSessionDomainException.name)
  }

  public static invalidUserSessionTokenHash() {
    return new UserSessionDomainException('Invalid UserSession token hash format', this.invalidUserSessionTokenHashId)
  }

  public static invalidDeviceInfo(raw: string) {
    const safeRawDeviceInfo = StringFormatter.formatSafe(raw, 60)
    return new UserSessionDomainException(`Invalid device information: ${safeRawDeviceInfo}`, this.invalidDeviceInfoId)
  }

  public static invalidDeviceCountryCode(countryCode: string) {
    return new UserSessionDomainException(`${countryCode} is not a valid country code`, this.invalidDeviceCountryCodeId)
  }

  public static invalidDeviceCity(city: string) {
    return new UserSessionDomainException(`${city} is not a valid city`, this.invalidDeviceCityId)
  }

  public static sessionAlreadyRevoked() {
    return new UserSessionDomainException('The user session has already been revoked', this.sessionAlreadyRevokedId)
  }

  public static sessionAlreadyExpired() {
    return new UserSessionDomainException('The user session has expired', this.sessionAlreadyExpiredId)
  }
}
