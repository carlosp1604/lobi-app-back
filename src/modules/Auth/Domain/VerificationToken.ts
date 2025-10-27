import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { VerificationTokenType } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenType'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

export class VerificationToken {
  public readonly id: VerificationTokenId
  public readonly email: UserEmail
  public readonly tokenHash: VerificationTokenTokenHash
  public readonly purpose: VerificationTokenType
  public readonly expiresAt: Date
  private readonly _usedAt: Date | null
  public readonly createdAt: Date

  constructor(
    id: VerificationTokenId,
    email: UserEmail,
    tokenHash: VerificationTokenTokenHash,
    purpose: VerificationTokenType,
    expiresAt: Date,
    usedAt: Date | null,
    createdAt: Date,
  ) {
    this.id = id
    this.email = email
    this.tokenHash = tokenHash
    this.purpose = purpose
    this.expiresAt = expiresAt
    this._usedAt = usedAt
    this.createdAt = createdAt
  }

  get usedAt(): Date | null {
    return this._usedAt
  }
}
