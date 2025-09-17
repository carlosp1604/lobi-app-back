import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'

export class UserCredentialTestBuilder {
  private _userId = UserIdMother.valid()
  private _passwordHash = PasswordHashMother.valid()
  private _failedAttempts = 0
  private _lockedUntil: Date | null = null
  private _lastLoginAt: Date | null = null
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withUserId(userId: UserId) {
    this._userId = userId
    return this
  }

  withPasswordHash(passwordHash: PasswordHash) {
    this._passwordHash = passwordHash
    return this
  }

  withFailedAttempts(failedAttempts: number) {
    this._failedAttempts = failedAttempts
    return this
  }

  withLockedUntil(date: Date | null) {
    this._lockedUntil = date
    return this
  }

  withLastLoginAt(date: Date | null) {
    this._lastLoginAt = date
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

  build(): UserCredential {
    return new UserCredential(
      this._userId,
      this._passwordHash,
      this._failedAttempts,
      this._lockedUntil,
      this._lastLoginAt,
      this._createdAt,
      this._updatedAt,
    )
  }
}
