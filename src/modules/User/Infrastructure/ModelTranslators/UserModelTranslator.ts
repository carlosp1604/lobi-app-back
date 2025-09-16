import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/UserEntity'
import { User } from '~/src/modules/User/Domain/User'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
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

  public static toDatabase(domain: User): UserRawModel {
    return {
      id: domain.id.toString(),
      email: domain.email.toString(),
      username: domain.username.toString(),
      name: domain.name.toString(),
      status: domain.status.toString(),
      role: domain.role.toString(),
      user_upload_id: domain.userUploadId ? domain.userUploadId.toString() : null,
      email_verified_at: domain.emailVerifiedAt.toISOString(),
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
      deleted_at: domain.deletedAt ? domain.deletedAt.toISOString() : null,
    }
  }
}
