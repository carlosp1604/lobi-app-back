import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'

export class User {
  public readonly id: Identifier
  public readonly email: EmailAddress
  public readonly username: UserUsername
  public readonly name: UserName
  public readonly status: UserStatus
  public readonly role: UserRole
  public readonly userUploadId: Identifier | null
  public readonly emailVerifiedAt: Date
  public readonly createdAt: Date
  public readonly updatedAt: Date
  public readonly deletedAt: Date | null

  constructor(
    id: Identifier,
    email: EmailAddress,
    username: UserUsername,
    name: UserName,
    status: UserStatus,
    role: UserRole,
    userUploadId: Identifier | null,
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

  public static create(
    userId: Identifier,
    email: EmailAddress,
    username: UserUsername,
    name: UserName,
    role: UserRole,
    now: Date,
  ): User {
    const status = UserStatus.active()

    return new User(userId, email, username, name, status, role, null, now, now, now, null)
  }

  public isActive(): boolean {
    return this.deletedAt === null && this.status.equals(UserStatus.active())
  }
}
