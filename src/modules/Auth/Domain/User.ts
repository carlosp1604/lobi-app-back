import { UserId } from '~/src/modules/Auth/Domain/ValueObject/UserId'
import { UserEmail } from '~/src/modules/Auth/Domain/ValueObject/UserEmail'
import { UserName } from '~/src/modules/Auth/Domain/ValueObject/UserName'
import { UserUsername } from '~/src/modules/Auth/Domain/ValueObject/UserUsername'
import { UserStatus } from '~/src/modules/Auth/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/Auth/Domain/ValueObject/UserRole'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'

export class User {
  public readonly id: UserId
  public readonly email: UserEmail
  public readonly username: UserUsername
  public readonly name: UserName
  public readonly status: UserStatus
  public readonly role: UserRole
  public readonly user_upload_id: UserUploadId | null
  public readonly email_verified_at: Date
  public readonly created_at: Date
  public readonly updated_at: Date
  public readonly deleted_at: Date | null

  constructor(
    id: UserId,
    email: UserEmail,
    username: UserUsername,
    name: UserName,
    status: UserStatus,
    role: UserRole,
    user_upload_id: UserUploadId | null,
    email_verified_at: Date,
    created_at: Date,
    updated_at: Date,
    deleted_at: Date | null,
  ) {
    this.id = id
    this.email = email
    this.username = username
    this.name = name
    this.status = status
    this.role = role
    this.user_upload_id = user_upload_id
    this.created_at = created_at
    this.updated_at = updated_at
    this.deleted_at = deleted_at
    this.email_verified_at = email_verified_at
  }

  public static create(
    userId: UserId,
    email: UserEmail,
    username: UserUsername,
    name: UserName,
    role: UserRole,
    userUploadId: UserUploadId | null,
    now: Date = new Date(),
  ): User {
    const status = UserStatus.active()
    const emailVerifiedAt = now

    return new User(userId, email, username, name, status, role, userUploadId, emailVerifiedAt, now, now, null)
  }
}
