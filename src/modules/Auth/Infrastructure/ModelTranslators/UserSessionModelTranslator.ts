import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'

export class UserSessionModelTranslator {
  public static toDomain(raw: UserSessionRawModel): UserSession {
    let deviceLocation: DeviceLocation | null = null

    if (raw.device_country_code || raw.device_city) {
      deviceLocation = DeviceLocation.fromProps({ countryCode: raw.device_country_code ?? '', city: raw.device_city ?? '' })
    }

    return new UserSession(
      Identifier.create(raw.id),
      Identifier.create(raw.user_id),
      UserSessionTokenHash.fromString(raw.token_hash),
      raw.expires_at,
      raw.revoked_at,
      raw.ip_hash ? UserIpHash.fromString(raw.ip_hash) : null,
      DeviceInfo.fromProps(raw.device_info),
      deviceLocation,
      raw.created_at,
      raw.updated_at,
    )
  }

  public static toDatabase(domain: UserSession): UserSessionRawModel {
    return {
      id: domain.id.value,
      user_id: domain.userId.value,
      token_hash: domain.tokenHash.value,
      expires_at: domain.expiresAt,
      revoked_at: domain.revokedAt ?? null,
      ip_hash: domain.ipHash ? domain.ipHash.value : null,
      device_info: domain.deviceInfo.value,
      device_country_code: domain.deviceLocation ? domain.deviceLocation.countryCode : null,
      device_city: domain.deviceLocation ? domain.deviceLocation.city : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
