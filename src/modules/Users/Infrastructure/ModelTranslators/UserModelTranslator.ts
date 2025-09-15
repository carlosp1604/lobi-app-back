import { UserRawModel } from '~/src/modules/Users/Infrastructure/Entities/UserEntity'
import { User } from '~/src/modules/Users/Domain/User'
import { UserId } from '~/src/modules/Users/Domain/ValueObject/UserId'
import { UserEmail } from '~/src/modules/Users/Domain/ValueObject/UserEmail'
import { UserUsername } from '~/src/modules/Users/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/Users/Domain/ValueObject/UserName'
import { UserStatus } from '~/src/modules/Users/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/Users/Domain/ValueObject/UserRole'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'

export class UserModelTranslator {
  public static toDomain(rawModel: UserRawModel): User {
    let deletedAt: Date | null = null

    if (rawModel.deleted_at) {
      deletedAt = new Date(rawModel.deleted_at)
    }

    return new User(
      UserId.fromString(rawModel.id),
      UserEmail.fromString(rawModel.email),
      UserUsername.fromString(rawModel.username),
      UserName.fromString(rawModel.name),
      UserStatus.fromString(rawModel.status),
      UserRole.fromString(rawModel.role),
      rawModel.user_upload_id ? UserUploadId.fromString(rawModel.user_upload_id) : null,
      new Date(rawModel.email_verified_at),
      new Date(rawModel.created_at),
      new Date(rawModel.updated_at),
      deletedAt,
    )
  }

  public toDatabase(domain: User): UserRawModel {
    return {
      id: domain.id.toString(),
      email: domain.email.toString(),
      username: domain.username.toString(),
      name: domain.name.toString(),
      status: domain.status.toString(),
      role: domain.role.toString(),
      user_upload_id: domain.user_upload_id ? domain.user_upload_id.toString() : null,
      email_verified_at: domain.email_verified_at.toISOString(),
      created_at: domain.created_at.toISOString(),
      updated_at: domain.updated_at.toISOString(),
      deleted_at: domain.deleted_at ? domain.deleted_at.toISOString() : null,
    }
  }
}
