import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserSessionDomainException extends DomainException {
  public static invalidUserSessionIdId = 'user_session_invalid_user_session_id'
  public static invalidUserSessionHashId = 'user_session_invalid_user_session_hash'
  public static invalidDeviceCountryCodeId = 'user_session_invalid_device_country_code'
  public static invalidDeviceCityId = 'user_session_invalid_device_city'
  public static invalidUserSessionIpHashId = 'user_session_invalid_user_session_ip_hash'
  public static invalidUserAgentId = 'user_session_invalid_user_agent'
  public static sessionNotFoundId = 'user_session_domain_session_not_found'
  public static sessionNotActiveId = 'user_session_domain_session_not_active'
  public static sessionAlreadyExistsId = 'user_session_domain_session_already_exists'
  public static sessionAlreadyRevokedId = 'user_session_domain_session_already_revoked'
  public static sessionAlreadyExpiredId = 'user_session_domain_session_already_expired'

  private constructor(message: string, id: string) {
    super(message, id, UserSessionDomainException.name)
  }

  public static invalidUserSessionId(userId: string) {
    return new UserSessionDomainException(`${userId} is not a valid User Session ID`, this.invalidUserSessionIdId)
  }

  public static invalidUserSessionHash() {
    return new UserSessionDomainException('Invalid session hash format', this.invalidUserSessionHashId)
  }

  public static invalidUserSessionIpHash() {
    return new UserSessionDomainException('Invalid session ip format', this.invalidUserSessionIpHashId)
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

  public static sessionNotFound(sessionId: string, userId: string) {
    return new UserSessionDomainException(
      `Session with ID ${sessionId} was not found in the user with ID ${userId}`,
      this.sessionNotFoundId,
    )
  }

  public static sessionNotActive(sessionId: string) {
    return new UserSessionDomainException(
      `Session with ID ${sessionId} is not active (already revoked or expired)`,
      this.sessionNotActiveId,
    )
  }

  public static sessionAlreadyRevoked(sessionId: string) {
    return new UserSessionDomainException(`Session with ID ${sessionId} is already revoked`, this.sessionAlreadyRevokedId)
  }

  public static sessionAlreadyExpired(sessionId: string) {
    return new UserSessionDomainException(`Session with ID ${sessionId} is already expired`, this.sessionAlreadyExpiredId)
  }

  public static sessionAlreadyExists(sessionId: string, userId: string) {
    return new UserSessionDomainException(
      `Session with ID ${sessionId} already exists in the user with ID ${userId}`,
      this.sessionAlreadyExistsId,
    )
  }
}
