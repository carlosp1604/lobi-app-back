import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

describe('VerificationToken', () => {
  let builder: VerificationTokenTestBuilder = new VerificationTokenTestBuilder()
  const now = new Date('2025-10-29T19:44:00Z')

  const futureExpiresAt = new Date(now.getTime() + 10000)
  const pastExpiresAt = new Date(now.getTime() - 10000)

  beforeEach(() => {
    builder = new VerificationTokenTestBuilder()
  })

  describe('create', () => {
    it('should create a new token with usedAt as null and correct createdAt', () => {
      const id = VerificationTokenIdMother.valid()
      const email = UserEmailMother.random()
      const tokenHash = VerificationTokenTokenHashMother.random()
      const purpose = VerificationTokenPurpose.createAccount()

      const token = VerificationToken.create(id, email, tokenHash, purpose, futureExpiresAt, now)

      expect(token.id).toBe(id)
      expect(token.email).toBe(email)
      expect(token.tokenHash).toBe(tokenHash)
      expect(token.purpose).toBe(purpose)
      expect(token.expiresAt).toBe(futureExpiresAt)
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

  describe('canBeUsedForPurpose', () => {
    const validEmail = UserEmailMother.random()
    const validPurpose = VerificationTokenPurpose.createAccount()

    const validToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(futureExpiresAt).withUsedAt(null).build()

    it('should return true when token is valid, active and email and purpose match', () => {
      const result = validToken.canBeUsedForPurpose(now, validEmail, validPurpose)

      expect(result).toBe(true)
    })

    it('should return false when token is already used', () => {
      const usedToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(new Date())
        .build()

      const result = usedToken.canBeUsedForPurpose(now, validEmail, validPurpose)

      expect(result).toBe(false)
    })

    it('should return false when the token is expired', () => {
      const expiredToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(pastExpiresAt).withUsedAt(null).build()

      const result = expiredToken.canBeUsedForPurpose(now, validEmail, validPurpose)

      expect(result).toBe(false)
    })

    it('should return false when the email does not match', () => {
      const otherEmail = UserEmailMother.random()

      const result = validToken.canBeUsedForPurpose(now, otherEmail, validPurpose)

      expect(result).toBe(false)
    })

    it('should return false when the purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      const result = validToken.canBeUsedForPurpose(now, validEmail, otherPurpose)

      expect(result).toBe(false)
    })
  })

  describe('markAsUsedForPurpose', () => {
    const validEmail = UserEmailMother.random()
    const validPurpose = VerificationTokenPurpose.createAccount()

    let validToken: VerificationToken

    beforeEach(() => {
      validToken = builder.withEmail(validEmail).withPurpose(validPurpose).withExpiresAt(futureExpiresAt).withUsedAt(null).build()
    })

    it('should mark as used (set usedAt) when token is valid, active and email and purpose match', () => {
      expect(validToken.usedAt).toBeNull()

      validToken.markAsUsedForPurpose(now, validEmail, validPurpose)

      expect(validToken.usedAt).toBe(now)
    })

    it('should throw error when token is already used', () => {
      const usedToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(futureExpiresAt)
        .withUsedAt(new Date(now.getTime() - 1000))
        .build()

      expect(() => usedToken.markAsUsedForPurpose(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyUsed(usedToken.id.toString()),
      )
    })

    it('should throw error when token is expired', () => {
      const expiredToken = builder
        .withEmail(validEmail)
        .withPurpose(validPurpose)
        .withExpiresAt(new Date(now.getTime() - 1000))
        .withUsedAt(null)
        .build()

      expect(() => expiredToken.markAsUsedForPurpose(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyExpired(expiredToken.id.toString()),
      )
    })

    it('should throw error when email does not match', () => {
      const otherEmail = UserEmailMother.random()

      expect(() => validToken.markAsUsedForPurpose(now, otherEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedByUser(validToken.id.toString(), otherEmail.toString()),
      )
    })

    it('should throw error when purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      expect(() => validToken.markAsUsedForPurpose(now, validEmail, otherPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedForPurpose(validToken.id.toString(), otherPurpose.toString()),
      )
    })
  })
})
