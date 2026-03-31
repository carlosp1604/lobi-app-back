import { User } from '~/src/modules/User/Domain/User'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'

export class UserTestBuilder {
  private _id = IdentifierMother.valid()
  private _email = EmailAddressMother.random()
  private _username = UserUsernameMother.random()
  private _name = UserNameMother.valid()
  private _status = UserStatus.active()
  private _role = UserRole.sportsman()
  private _uploadId: Identifier | null = null
  private _emailVerifiedAt = new Date()
  private _createdAt = new Date()
  private _updatedAt = new Date()
  private _deletedAt: Date | null = null

  withId(userId: Identifier) {
    this._id = userId
    return this
  }

  withEmail(userEmail: EmailAddress) {
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

  withUploadId(userUploadId: Identifier | null) {
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
