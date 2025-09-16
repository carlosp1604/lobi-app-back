import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

export class UserCredential {
  public readonly userId: UserId
  public readonly passwordHash: PasswordHash
  public readonly failedAttempts: number
  public readonly lockedUntil: Date | null
  public readonly passwordSetAt: Date
  public readonly lastUsedAt: Date
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(
    userId: UserId,
    passwordHash: PasswordHash,
    failedAttempts: number,
    lockedUntil: Date | null,
    passwordSetAt: Date,
    lastUsedAt: Date,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.userId = userId
    this.passwordHash = passwordHash
    this.failedAttempts = failedAttempts
    this.lockedUntil = lockedUntil
    this.passwordSetAt = passwordSetAt
    this.lastUsedAt = lastUsedAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
