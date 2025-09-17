import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

export class UserCredential {
  public readonly userId: UserId
  public readonly passwordHash: PasswordHash
  public readonly failedAttempts: number
  public readonly lockedUntil: Date | null
  public readonly lastLoginAt: Date | null
  public readonly createdAt: Date
  public readonly updatedAt: Date

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
    this.passwordHash = passwordHash
    this.failedAttempts = failedAttempts
    this.lockedUntil = lockedUntil
    this.lastLoginAt = lastLoginAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
