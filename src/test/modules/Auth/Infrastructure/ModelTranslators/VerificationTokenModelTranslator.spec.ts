import { VerificationTokenModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/VerificationTokenModelTranslator'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

describe('VerificationTokenModelTranslator', () => {
  const isoDate = '2025-10-27T15:37:00.000Z'
  const now = new Date(isoDate)
  const futureExpiresAt = new Date(now.getTime() + 15 * 60 * 1000)

  const baseRaw = makeRawVerificationToken({
    email: UserEmailMother.random().toString(),
    purpose: VerificationTokenPurpose.createAccount().toString(),
    created_at: now,
    expires_at: futureExpiresAt,
    used_at: null,
  })

  describe('toDomain', () => {
    const checkResult = (result: VerificationToken, raw: VerificationTokenRawModel) => {
      expect(result.id).toBeInstanceOf(VerificationTokenId)
      expect(result.email).toBeInstanceOf(UserEmail)
      expect(result.tokenHash).toBeInstanceOf(VerificationTokenTokenHash)
      expect(result.purpose).toBeInstanceOf(VerificationTokenPurpose)

      expect(result.id.toString()).toBe(raw.id)
      expect(result.email.toString()).toBe(raw.email)
      expect(result.tokenHash.toString()).toBe(raw.token_hash)
      expect(result.purpose.toString()).toBe(raw.purpose)
      expect(result.expiresAt.getTime()).toBe(raw.expires_at.getTime())
      expect(result.usedAt).toEqual(raw.used_at)
      expect(result.createdAt.getTime()).toBe(raw.created_at.getTime())
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw, used_at: now }

      const result = VerificationTokenModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.usedAt?.getTime()).toBe(now.getTime())
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
      const rawInvalidEmail = { ...baseRaw, email: 'not-an-email' }

      expect(() => VerificationTokenModelTranslator.toDomain(rawInvalidEmail)).toThrow(
        UserDomainException.invalidUserEmail('not-an-email'),
      )
    })
  })

  describe('toDatabase', () => {
    let tokenBuilder: VerificationTokenTestBuilder

    beforeEach(() => {
      tokenBuilder = new VerificationTokenTestBuilder()
        .withId(VerificationTokenIdMother.valid())
        .withEmail(UserEmailMother.random())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .withPurpose(VerificationTokenPurpose.createAccount())
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(null)
        .withCreatedAt(now)
    })

    const checkResult = (result: VerificationTokenRawModel, domain: VerificationToken) => {
      expect(result.id).toBe(domain.id.toString())
      expect(result.email).toBe(domain.email.toString())
      expect(result.token_hash).toBe(domain.tokenHash.toString())
      expect(result.purpose).toBe(domain.purpose.toString())
      expect(result.expires_at.getTime()).toBe(domain.expiresAt.getTime())
      expect(result.used_at).toEqual(domain.usedAt)
      expect(result.created_at.getTime()).toBe(domain.createdAt.getTime())
    }

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const verificationToken = tokenBuilder.withUsedAt(now).build()

      const result = VerificationTokenModelTranslator.toDatabase(verificationToken)

      checkResult(result, verificationToken)
      expect(result.used_at?.getTime()).toBe(now.getTime())
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
      expect(verificationToken.expiresAt.getTime()).toEqual(snapshot.expiresAt.getTime())
      expect(verificationToken.usedAt).toBeNull()
      expect(snapshot.usedAt).toBeNull()
      expect(verificationToken.createdAt.getTime()).toEqual(snapshot.createdAt.getTime())
    })
  })
})
