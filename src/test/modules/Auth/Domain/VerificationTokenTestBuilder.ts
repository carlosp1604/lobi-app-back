import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'

export class VerificationTokenTestBuilder {
  private _id: Identifier = IdentifierMother.valid()
  private _email: EmailAddress = EmailAddressMother.random()
  private _tokenHash: VerificationTokenTokenHash = VerificationTokenTokenHashMother.random()
  private _purpose: VerificationTokenPurpose = VerificationTokenPurpose.createAccount()
  private _expiresAt: Date = new Date()
  private _usedAt: Date | null = null
  private _createdAt: Date = new Date()

  public withId(id: Identifier): this {
    this._id = id
    return this
  }

  public withEmail(email: EmailAddress): this {
    this._email = email
    return this
  }

  public withTokenHash(hash: VerificationTokenTokenHash): this {
    this._tokenHash = hash
    return this
  }

  public withPurpose(purpose: VerificationTokenPurpose): this {
    this._purpose = purpose
    return this
  }

  public withExpiresAt(date: Date): this {
    this._expiresAt = date
    return this
  }

  public withUsedAt(date: Date | null): this {
    this._usedAt = date
    return this
  }

  public withCreatedAt(date: Date): this {
    this._createdAt = date
    return this
  }

  public build(): VerificationToken {
    return new VerificationToken(this._id, this._email, this._tokenHash, this._purpose, this._expiresAt, this._usedAt, this._createdAt)
  }
}
