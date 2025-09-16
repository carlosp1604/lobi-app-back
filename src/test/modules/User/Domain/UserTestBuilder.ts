import { User } from '~/src/modules/User/Domain/User'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'

export class UserTestBuilder {
  private _id = UserId.fromString('05a1d9b1-9d24-42b8-b482-c862a668f4a4')
  private _email = UserEmail.fromString('test@example.com')
  private _username = UserUsername.fromString('tester')
  private _name = UserName.fromString('Test User')
  private _status = UserStatus.active()
  private _role = UserRole.sportsman()
  private _uploadId: UserUploadId | null = null
  private _emailVerifiedAt = new Date()
  private _createdAt = new Date()
  private _updatedAt = new Date()
  private _deletedAt: Date | null = new Date()

  withId(userId: UserId) {
    this._id = userId
    return this
  }

  withEmail(userEmail: UserEmail) {
    this._email = userEmail
    return this
  }

  withUsername(username: UserUsername) {
    this._username = username
    return this
  }

  withName(userName: UserName) {
    this._name = userName
    return this
  }

  withRoleUser(userRole: UserRole) {
    this._role = userRole
    return this
  }

  withStatus(userStatus: UserStatus) {
    this._status = userStatus
    return this
  }

  withUploadId(userUploadId: UserUploadId | null) {
    this._uploadId = userUploadId
    return this
  }

  withCreatedAt(date: Date) {
    this._createdAt = date
    return this
  }

  withUpdatedAt(date: Date) {
    this._updatedAt = date
    return this
  }

  withDeletedAt(date: Date | null) {
    this._deletedAt = date
    return this
  }

  withEmailVerifiedAt(date: Date) {
    this._emailVerifiedAt = date
    return this
  }

  build(): User {
    return new User(
      this._id,
      this._email,
      this._username,
      this._name,
      this._status,
      this._role,
      this._uploadId,
      this._emailVerifiedAt,
      this._createdAt,
      this._updatedAt,
      this._deletedAt,
    )
  }
}
