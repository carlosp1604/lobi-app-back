import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

export class UserCredential {
  public readonly userId: UserId
  private _passwordHash: PasswordHash
  private _failedAttempts: number
  private _lockedUntil: Date | null
  private _lastLoginAt: Date | null
  public readonly createdAt: Date
  private _updatedAt: Date

  constructor(
    userId: UserId,
    passwordHash: PasswordHash,
    failedAttempts: number,
    lockedUntil: Date | null,
    lastLoginAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.userId = userId
    this._passwordHash = passwordHash
    this._failedAttempts = failedAttempts
    this._lockedUntil = lockedUntil
    this._lastLoginAt = lastLoginAt
    this.createdAt = createdAt
    this._updatedAt = updatedAt
  }

  public get failedAttempts(): number {
    return this._failedAttempts
  }

  public get lastLoginAt(): Date | null {
    return this._lastLoginAt
  }

  public get lockedUntil(): Date | null {
    return this._lockedUntil
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  public get passwordHash(): PasswordHash {
    return this._passwordHash
  }

  public incrementFailedAttempts(now: Date): void {
    this._failedAttempts = Math.max(0, this._failedAttempts) + 1

    this._updatedAt = now
  }

  public lock(lockUntil: Date, now: Date): void {
    this._lockedUntil = lockUntil
    this._updatedAt = now
  }

  public releaseLock(now: Date): void {
    this._lockedUntil = null
    this._updatedAt = now
  }

  public resetAfterSuccessfulLogin(now: Date): void {
    this._lockedUntil = null
    this._failedAttempts = 0
    this._updatedAt = now
    this._lastLoginAt = now
  }

  public isLocked(now: Date): boolean {
    return !!this._lockedUntil && this._lockedUntil > now
  }

  public updatePasswordHash(newPasswordHash: PasswordHash, now: Date): void {
    this._passwordHash = newPasswordHash
    this._updatedAt = now
    this._failedAttempts = 0
    this._lockedUntil = null
  }

  public static create(userId: UserId, passwordHash: PasswordHash, now: Date): UserCredential {
    return new UserCredential(userId, passwordHash, 0, null, null, now, now)
  }
}
