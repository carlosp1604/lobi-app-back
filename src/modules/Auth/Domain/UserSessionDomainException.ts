import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserSessionDomainException extends DomainException {
  public static invalidUserSessionIdId = 'user_session_invalid_user_session_id'
  public static invalidUserSessionTokenHashId = 'user_session_invalid_user_session_token_hash'
  public static invalidDeviceCountryCodeId = 'user_session_invalid_device_country_code'
  public static invalidDeviceCityId = 'user_session_invalid_device_city'
  public static invalidUserSessionIpHashId = 'user_session_invalid_user_session_ip_hash'
  public static invalidUserAgentId = 'user_session_invalid_user_agent'
  public static sessionAlreadyRevokedId = 'user_session_domain_session_already_revoked'
  public static sessionAlreadyExpiredId = 'user_session_domain_session_already_expired'

  private constructor(message: string, id: string) {
    super(message, id, UserSessionDomainException.name)
  }

  public static invalidUserSessionId(userSessionId: string) {
    return new UserSessionDomainException(`${userSessionId} is not a valid UserSession ID`, this.invalidUserSessionIdId)
  }

  public static invalidUserSessionTokenHash() {
    return new UserSessionDomainException('Invalid UserSession token hash format', this.invalidUserSessionTokenHashId)
  }

  public static invalidUserSessionIpHash() {
    return new UserSessionDomainException('Invalid UserSession IP format', this.invalidUserSessionIpHashId)
  }

  public static invalidUserAgent(userAgent: string) {
    return new UserSessionDomainException(`${userAgent} is not a valid User Agent`, this.invalidUserAgentId)
  }

  public static invalidDeviceCountryCode(countryCode: string) {
    return new UserSessionDomainException(`${countryCode} is not a valid country code`, this.invalidDeviceCountryCodeId)
  }

  public static invalidDeviceCity(city: string) {
    return new UserSessionDomainException(`${city} is not a valid city`, this.invalidDeviceCityId)
  }

  public static sessionAlreadyRevoked(sessionId: string) {
    return new UserSessionDomainException(`UserSession with ID ${sessionId} is already revoked`, this.sessionAlreadyRevokedId)
  }

  public static sessionAlreadyExpired(sessionId: string) {
    return new UserSessionDomainException(`UserSession with ID ${sessionId} is already expired`, this.sessionAlreadyExpiredId)
  }
}
