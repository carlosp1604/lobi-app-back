import { User } from '~/src/modules/User/Domain/User'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserRawModel, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export class UserModelTranslator {
  public static toDomain(rawModel: UserRawModelWithRelations): User {
    return new User(
      UserId.fromString(rawModel.id),
      EmailAddress.fromString(rawModel.email),
      UserUsername.fromString(rawModel.username),
      UserName.fromString(rawModel.name),
      UserStatus.fromString(rawModel.status),
      UserRole.fromString(rawModel.role),
      rawModel.user_upload_id ? UserUploadId.fromString(rawModel.user_upload_id) : null,
      rawModel.email_verified_at,
      rawModel.created_at,
      rawModel.updated_at,
      rawModel.deleted_at,
    )
  }

  public static toDatabase(domain: User): UserRawModel {
    return {
      id: domain.id.value,
      email: domain.email.value,
      username: domain.username.value,
      name: domain.name.value,
      status: domain.status.value,
      role: domain.role.value,
      user_upload_id: domain.userUploadId ? domain.userUploadId.value : null,
      email_verified_at: domain.emailVerifiedAt,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
      deleted_at: domain.deletedAt,
    }
  }
}
