import { VerificationTokenModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/VerificationTokenModelTranslator'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

describe('VerificationTokenModelTranslator', () => {
  const isoDate = '2025-10-27T15:37:00.000Z'
  const now = new Date(isoDate)
  const futureExpiresAt = new Date(now.getTime() + 15 * 60 * 1000)

  const baseRaw = makeRawVerificationToken({
    email: EmailAddressMother.random().toString(),
    purpose: VerificationTokenPurpose.createAccount().value,
    created_at: now,
    expires_at: futureExpiresAt,
    used_at: null,
  })

  describe('toDomain', () => {
    const checkResult = (result: VerificationToken, raw: VerificationTokenRawModel) => {
      expect(result.id).toBeInstanceOf(Identifier)
      expect(result.email).toBeInstanceOf(EmailAddress)
      expect(result.tokenHash).toBeInstanceOf(VerificationTokenTokenHash)
      expect(result.purpose).toBeInstanceOf(VerificationTokenPurpose)

      expect(result.id.value).toBe(raw.id)
      expect(result.email.value).toBe(raw.email)
      expect(result.tokenHash.value).toBe(raw.token_hash)
      expect(result.purpose.value).toBe(raw.purpose)
      expect(result.expiresAt).toEqual(raw.expires_at)
      expect(result.usedAt).toEqual(raw.used_at)
      expect(result.createdAt).toEqual(raw.created_at)
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw, used_at: now }

      const result = VerificationTokenModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.usedAt).toEqual(now)
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw }

      const result = VerificationTokenModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.usedAt).toBeNull()
    })

    it('does not mutate the input raw model', () => {
      const raw = structuredClone(baseRaw)

      VerificationTokenModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })

    it('should propagate errors from ValueObject', () => {
      const invalidEmail = EmailAddressMother.invalid()
      const rawInvalidEmail = { ...baseRaw, email: invalidEmail }

      expect(() => VerificationTokenModelTranslator.toDomain(rawInvalidEmail)).toThrow(
        SharedDomainException.invalidEmailAddress(invalidEmail),
      )
    })
  })

  describe('toDatabase', () => {
    let tokenBuilder: VerificationTokenTestBuilder

    beforeEach(() => {
      tokenBuilder = new VerificationTokenTestBuilder()
        .withId(IdentifierMother.valid())
        .withEmail(EmailAddressMother.random())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .withPurpose(VerificationTokenPurpose.createAccount())
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(null)
        .withCreatedAt(now)
    })

    const checkResult = (result: VerificationTokenRawModel, domain: VerificationToken) => {
      expect(result.id).toBe(domain.id.value)
      expect(result.email).toBe(domain.email.value)
      expect(result.token_hash).toBe(domain.tokenHash.value)
      expect(result.purpose).toBe(domain.purpose.value)
      expect(result.expires_at).toEqual(domain.expiresAt)
      expect(result.used_at).toEqual(domain.usedAt)
      expect(result.created_at).toEqual(domain.createdAt)
    }

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const verificationToken = tokenBuilder.withUsedAt(now).build()

      const result = VerificationTokenModelTranslator.toDatabase(verificationToken)

      checkResult(result, verificationToken)
      expect(result.used_at).toEqual(now)
    })

    it('should return the correct raw model when nullable fields are NULL', () => {
      const verificationToken = tokenBuilder.withUsedAt(null).build()

      const result = VerificationTokenModelTranslator.toDatabase(verificationToken)

      checkResult(result, verificationToken)
      expect(result.used_at).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const verificationToken = tokenBuilder.build()

      const snapshot = {
        id: verificationToken.id,
        email: verificationToken.email,
        tokenHash: verificationToken.tokenHash,
        purpose: verificationToken.purpose,
        expiresAt: verificationToken.expiresAt,
        usedAt: verificationToken.usedAt,
        createdAt: verificationToken.createdAt,
      }

      VerificationTokenModelTranslator.toDatabase(verificationToken)

      expect(verificationToken.id.equals(snapshot.id)).toBe(true)
      expect(verificationToken.email.equals(snapshot.email)).toBe(true)
      expect(verificationToken.tokenHash.equals(snapshot.tokenHash)).toBe(true)
      expect(verificationToken.purpose.equals(snapshot.purpose)).toBe(true)
      expect(verificationToken.expiresAt).toEqual(snapshot.expiresAt)
      expect(verificationToken.usedAt).toBeNull()
      expect(snapshot.usedAt).toBeNull()
      expect(verificationToken.createdAt).toEqual(snapshot.createdAt)
    })
  })
})
