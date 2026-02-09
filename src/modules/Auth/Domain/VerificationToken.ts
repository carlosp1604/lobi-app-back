import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'

export class VerificationToken {
  public readonly id: VerificationTokenId
  public readonly email: VerificationTokenEmail
  public readonly tokenHash: VerificationTokenTokenHash
  public readonly purpose: VerificationTokenPurpose
  public readonly expiresAt: Date
  private _usedAt: Date | null
  public readonly createdAt: Date

  constructor(
    id: VerificationTokenId,
    email: VerificationTokenEmail,
    tokenHash: VerificationTokenTokenHash,
    purpose: VerificationTokenPurpose,
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

  public static create(
    id: VerificationTokenId,
    email: VerificationTokenEmail,
    tokenHash: VerificationTokenTokenHash,
    purpose: VerificationTokenPurpose,
    expiresTtlMs: number,
    now: Date,
  ): VerificationToken {
    const expiresAt = new Date(now.getTime() + expiresTtlMs)

    return new VerificationToken(id, email, tokenHash, purpose, expiresAt, null, now)
  }

  get usedAt(): Date | null {
    return this._usedAt
  }

  public isUsed(): boolean {
    return this._usedAt !== null
  }

  public isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime()
  }

  public canBeUsedForPurpose(now: Date, email: VerificationTokenEmail, purpose: VerificationTokenPurpose): boolean {
    return !this.isUsed() && !this.isExpired(now) && this.email.equals(email) && this.purpose.equals(purpose)
  }

  public markAsUsedForPurpose(now: Date, email: VerificationTokenEmail, purpose: VerificationTokenPurpose) {
    if (this.isUsed()) {
      throw VerificationTokenDomainException.alreadyUsed(this.id.toString())
    }

    if (this.isExpired(now)) {
      throw VerificationTokenDomainException.alreadyExpired(this.id.toString())
    }

    if (!this.email.equals(email)) {
      throw VerificationTokenDomainException.cannotBeUsedByUser(this.id.toString(), email.toString())
    }

    if (!this.purpose.equals(purpose)) {
      throw VerificationTokenDomainException.cannotBeUsedForPurpose(this.id.toString(), purpose.toString())
    }

    this._usedAt = now
  }
}
