import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export class UserSessionModelTranslator {
  public static toDomain(raw: UserSessionRawModel): UserSession {
    let deviceLocation: DeviceLocation | null = null

    if (raw.device_country_code || raw.device_city) {
      deviceLocation = DeviceLocation.fromProps({ countryCode: raw.device_country_code ?? '', city: raw.device_city ?? '' })
    }

    return new UserSession(
      UserSessionId.fromString(raw.id),
      UserId.fromString(raw.user_id),
      UserSessionHash.fromString(raw.token_hash),
      raw.expires_at,
      raw.revoked_at,
      raw.ip_hash ? UserSessionIpHash.fromString(raw.ip_hash) : null,
      UserAgent.fromString(raw.user_agent),
      deviceLocation,
      raw.created_at,
      raw.updated_at,
    )
  }

  public static toDatabase(domain: UserSession): UserSessionRawModel {
    return {
      id: domain.id.toString(),
      user_id: domain.userId.toString(),
      token_hash: domain.tokenHash.toString(),
      expires_at: domain.expiresAt,
      revoked_at: domain.revokedAt ?? null,
      ip_hash: domain.ipHash ? domain.ipHash.toString() : null,
      user_agent: domain.userAgent.toString(),
      device_country_code: domain.deviceLocation ? domain.deviceLocation.countryCode : null,
      device_city: domain.deviceLocation ? domain.deviceLocation.city : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
