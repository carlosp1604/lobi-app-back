import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionRaw } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'

export class UserSessionModelTranslator {
  public static toDomain(raw: UserSessionRaw): UserSession {
    return new UserSession(
      UserSessionId.fromString(raw.id),
      UserId.fromString(raw.user_id),
      UserSessionHash.fromString(raw.token_hash),
      raw.expires_at,
      raw.revoked_at,
      raw.ip_hash ? UserSessionIpHash.fromString(raw.ip_hash) : null,
      raw.user_agent ? UserAgent.fromString(raw.user_agent) : null,
      raw.device_country ?? null,
      raw.device_city ?? null,
      raw.device_timezone ?? null,
      raw.created_at,
      raw.updated_at,
    )
  }

  public static toDatabase(domain: UserSession): UserSessionRaw {
    return {
      id: domain.id.toString(),
      user_id: domain.userId.toString(),
      token_hash: domain.tokenHash.toString(),
      expires_at: domain.expiresAt,
      revoked_at: domain.revokedAt ?? null,
      ip_hash: domain.ipHash ? domain.ipHash.toString() : null,
      user_agent: domain.userAgent ? domain.userAgent.toString() : null,
      device_country: domain.deviceCountry ?? null,
      device_city: domain.deviceCity ?? null,
      device_timezone: domain.deviceTimezone ?? null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
