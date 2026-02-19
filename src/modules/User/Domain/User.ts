import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

export class User {
  public readonly id: UserId
  public readonly email: UserEmail
  public readonly username: UserUsername
  public readonly name: UserName
  public readonly status: UserStatus
  public readonly role: UserRole
  public readonly userUploadId: UserUploadId | null
  public readonly emailVerifiedAt: Date
  public readonly createdAt: Date
  public readonly updatedAt: Date
  public readonly deletedAt: Date | null

  constructor(
    id: UserId,
    email: UserEmail,
    username: UserUsername,
    name: UserName,
    status: UserStatus,
    role: UserRole,
    userUploadId: UserUploadId | null,
    emailVerifiedAt: Date,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id
    this.email = email
    this.username = username
    this.name = name
    this.status = status
    this.role = role
    this.userUploadId = userUploadId
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.deletedAt = deletedAt
    this.emailVerifiedAt = emailVerifiedAt
  }

  public static create(userId: UserId, email: UserEmail, username: UserUsername, name: UserName, role: UserRole, now: Date): User {
    const status = UserStatus.active()

    return new User(userId, email, username, name, status, role, null, now, now, now, null)
  }

  public isActive(): boolean {
    return this.deletedAt === null && this.status.equals(UserStatus.active())
  }
}
