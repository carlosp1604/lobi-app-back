import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserSessionDomainException extends DomainException {
  public static invalidUserSessionIdId = 'user_session_invalid_user_session_id'
  public static invalidUserSessionHashId = 'user_session_invalid_user_session_hash'
  public static invalidUserSessionIpHashId = 'user_session_invalid_user_session_ip_hash'

  private constructor(message: string, id: string) {
    super(message, id, UserSessionDomainException.name)
  }

  public static invalidUserSessionId(userId: string) {
    return new UserSessionDomainException(`${userId} is not a valid User ID`, this.invalidUserSessionIdId)
  }

  public static invalidUserSessionHash() {
    return new UserSessionDomainException('Invalid session hash format', this.invalidUserSessionHashId)
  }

  public static invalidUserSessionIpHash() {
    return new UserSessionDomainException('Invalid session ip format', this.invalidUserSessionIpHashId)
  }
}
