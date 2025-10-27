import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenType } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenType'

export class VerificationTokenTestBuilder {
  private _id: VerificationTokenId = VerificationTokenIdMother.valid()
  private _email: UserEmail = UserEmailMother.random()
  private _tokenHash: VerificationTokenTokenHash = VerificationTokenTokenHashMother.random()
  private _purpose: VerificationTokenType = VerificationTokenType.createAccount()
  private _expiresAt: Date = new Date()
  private _usedAt: Date | null = null
  private _createdAt: Date = new Date()

  public withId(id: VerificationTokenId): this {
    this._id = id
    return this
  }

  public withEmail(email: UserEmail): this {
    this._email = email
    return this
  }

  public withTokenHash(hash: VerificationTokenTokenHash): this {
    this._tokenHash = hash
    return this
  }

  public withPurpose(purpose: VerificationTokenType): this {
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
