import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationToken {
  public readonly id: Identifier
  public readonly email: EmailAddress
  public readonly tokenHash: VerificationTokenTokenHash
  public readonly purpose: VerificationTokenPurpose
  public readonly expiresAt: Date
  private _usedAt: Date | null
  public readonly createdAt: Date

  constructor(
    id: Identifier,
    email: EmailAddress,
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
    id: Identifier,
    email: EmailAddress,
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

  public validate(now: Date, email: EmailAddress, purpose: VerificationTokenPurpose): Result<void, VerificationTokenDomainException> {
    if (this.isUsed()) {
      return fail(VerificationTokenDomainException.alreadyUsed())
    }

    if (this.isExpired(now)) {
      return fail(VerificationTokenDomainException.alreadyExpired())
    }

    if (!this.email.equals(email)) {
      return fail(VerificationTokenDomainException.cannotBeUsedByUser(email.value))
    }

    if (!this.purpose.equals(purpose)) {
      return fail(VerificationTokenDomainException.cannotBeUsedForPurpose())
    }

    return success(undefined)
  }

  public markAsUsed(now: Date, email: EmailAddress, purpose: VerificationTokenPurpose): void {
    const validationResult = this.validate(now, email, purpose)

    if (!validationResult.success) {
      throw validationResult.error
    }

    this._usedAt = now
  }
}
