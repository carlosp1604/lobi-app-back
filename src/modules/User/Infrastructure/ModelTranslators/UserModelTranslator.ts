import { User } from '~/src/modules/User/Domain/User'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserRepositoryRelationships } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { Relationship } from '~/src/modules/Shared/Domain/Relationship/Relationship'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserRawModel, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export class UserModelTranslator {
  public static toDomain(rawModel: UserRawModelWithRelations, relationShips: ReadonlyArray<UserRepositoryRelationships> = []): User {
    let userCredentialRelationship: Relationship<UserCredential> = Relationship.notLoaded()

    if (relationShips.includes('credential')) {
      userCredentialRelationship = Relationship.missing()

      if (rawModel.credential) {
        const credentialDomainModel = UserCredentialModelTranslator.toDomain(rawModel.credential)

        userCredentialRelationship = Relationship.loaded(credentialDomainModel)
      }
    }

    return new User(
      UserId.fromString(rawModel.id),
      UserEmail.fromString(rawModel.email),
      UserUsername.fromString(rawModel.username),
      UserName.fromString(rawModel.name),
      UserStatus.fromString(rawModel.status),
      UserRole.fromString(rawModel.role),
      rawModel.user_upload_id ? UserUploadId.fromString(rawModel.user_upload_id) : null,
      rawModel.email_verified_at,
      rawModel.created_at,
      rawModel.updated_at,
      rawModel.deleted_at,
      userCredentialRelationship,
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
      email_verified_at: domain.emailVerifiedAt,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
      deleted_at: domain.deletedAt,
    }
  }
}
