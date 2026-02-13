import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'

describe('VerificationToken', () => {
  let builder: VerificationTokenTestBuilder = new VerificationTokenTestBuilder()
  const now = new Date('2025-10-29T19:44:00Z')

  const expiresTtlMs = 10000
  const futureExpiresAt = new Date(now.getTime() + expiresTtlMs)
  const pastExpiresAt = new Date(now.getTime() - 10000)

  beforeEach(() => {
    builder = new VerificationTokenTestBuilder()
  })

  describe('create', () => {
    it('should create a new token with usedAt as null and correct createdAt', () => {
      const id = VerificationTokenIdMother.valid()
      const email = VerificationTokenEmailMother.random()
      const tokenHash = VerificationTokenTokenHashMother.random()
      const purpose = VerificationTokenPurpose.createAccount()

      const token = VerificationToken.create(id, email, tokenHash, purpose, expiresTtlMs, now)

      expect(token.id).toBe(id)
      expect(token.email).toBe(email)
      expect(token.tokenHash).toBe(tokenHash)
      expect(token.purpose).toBe(purpose)
      expect(token.expiresAt.getTime()).toBe(futureExpiresAt.getTime())
      expect(token.usedAt).toBeNull()
      expect(token.createdAt).toBe(now)
    })
  })

  describe('isUsed', () => {
    it('should return true when usedAt is set', () => {
      const token = builder.withUsedAt(now).build()

      expect(token.isUsed()).toBe(true)
    })

    it('should return false when usedAt is null', () => {
      const token = builder.withUsedAt(null).build()

      expect(token.isUsed()).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const token = builder.withExpiresAt(pastExpiresAt).build()

      expect(token.isExpired(now)).toBe(true)
    })

    it('should return true if expiresAt is exactly now', () => {
      const token = builder.withExpiresAt(now).build()

      expect(token.isExpired(now)).toBe(true)
    })

    it('should return false if expiresAt is in the future', () => {
      const token = builder.withExpiresAt(futureExpiresAt).build()

      expect(token.isExpired(now)).toBe(false)
    })
  })

  describe('validate', () => {
    const validEmail = VerificationTokenEmailMother.random()
    const validPurpose = VerificationTokenPurpose.createAccount()

    const validToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(futureExpiresAt).withUsedAt(null).build()

    it('should not throw error when token is valid, active and email and purpose match', () => {
      expect(() => validToken.validate(now, validEmail, validPurpose)).not.toThrow()
    })

    it('should throw alreadyUsed error when token is already used', () => {
      const usedToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(new Date())
        .build()

      expect(() => usedToken.validate(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyUsed(usedToken.id.value),
      )
    })

    it('should throw alreadyExpired error when token is expired', () => {
      const expiredToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(pastExpiresAt).withUsedAt(null).build()

      expect(() => expiredToken.validate(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyExpired(expiredToken.id.value),
      )
    })

    it('should throw cannotBeUsedByUser error when the candidate email does not match', () => {
      const otherEmail = VerificationTokenEmailMother.random()

      expect(() => validToken.validate(now, otherEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedByUser(validToken.id.value, otherEmail.value),
      )
    })

    it('should throw cannotBeUsedForPurpose error when the candidate purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      expect(() => validToken.validate(now, validEmail, otherPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedForPurpose(validToken.id.value, otherPurpose.value),
      )
    })
  })

  describe('markAsUsed', () => {
    const validEmail = VerificationTokenEmailMother.random()
    const validPurpose = VerificationTokenPurpose.createAccount()

    let validToken: VerificationToken

    beforeEach(() => {
      validToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(futureExpiresAt).withUsedAt(null).build()
    })

    it('should mark as used (set usedAt) when token is valid, active and email and purpose match', () => {
      expect(validToken.usedAt).toBeNull()

      validToken.markAsUsed(now, validEmail, validPurpose)

      expect(validToken.usedAt).toBe(now)
    })

    it('should throw alreadyUsed error when token is already used', () => {
      const usedAt = new Date(now.getTime() - 1000)
      const usedToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(usedAt)
        .build()

      expect(() => usedToken.markAsUsed(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyUsed(usedToken.id.toString()),
      )
      expect(usedToken.usedAt).toBe(usedAt)
    })

    it('should throw alreadyExpired error when token is expired', () => {
      const expiredToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(new Date(now.getTime() - 1000))
        .withUsedAt(null)
        .build()

      expect(() => expiredToken.markAsUsed(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyExpired(expiredToken.id.value),
      )
      expect(expiredToken.usedAt).toBeNull()
    })

    it('should throw cannotBeUsedByUser error when candidate email does not match', () => {
      const otherEmail = VerificationTokenEmailMother.random()

      expect(() => validToken.markAsUsed(now, otherEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedByUser(validToken.id.value, otherEmail.value),
      )
      expect(validToken.usedAt).toBeNull()
    })

    it('should throw cannotBeUsedForPurpose error when candidate purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      expect(() => validToken.markAsUsed(now, validEmail, otherPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedForPurpose(validToken.id.value, otherPurpose.value),
      )
      expect(validToken.usedAt).toBeNull()
    })
  })
})
