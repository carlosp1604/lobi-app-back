import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'

export class UserCredentialModelTranslator {
  public static toDomain(raw: UserCredentialRawModel): UserCredential {
    return new UserCredential(
      UserId.fromString(raw.user_id),
      PasswordHash.fromString(raw.password_hash),
      raw.failed_attempts,
      raw.locked_until,
      raw.last_login_at,
      raw.created_at,
      raw.updated_at,
    )
  }

  public static toDatabase(domain: UserCredential): UserCredentialRawModel {
    return {
      user_id: domain.userId.value,
      password_hash: domain.passwordHash.value,
      failed_attempts: domain.failedAttempts,
      locked_until: domain.lockedUntil,
      last_login_at: domain.lastLoginAt,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
