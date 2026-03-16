import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

describe('VerificationToken', () => {
  let validTokenBuilder: VerificationTokenTestBuilder = new VerificationTokenTestBuilder()
  const now = new Date('2025-10-29T19:44:00Z')

  const expiresTtlMs = 10000
  const futureExpiresAt = new Date(now.getTime() + expiresTtlMs)
  const pastExpiresAt = new Date(now.getTime() - 10000)
  const validEmail = EmailAddressMother.random()
  const validPurpose = VerificationTokenPurpose.createAccount()

  beforeEach(() => {
    validTokenBuilder = new VerificationTokenTestBuilder()
      .withUsedAt(null)
      .withExpiresAt(futureExpiresAt)
      .withCreatedAt(now)
      .withEmail(validEmail)
      .withPurpose(validPurpose)
  })

  describe('create', () => {
    it('should create a new token with usedAt as null and correct createdAt', () => {
      const id = IdentifierMother.valid()
      const email = EmailAddressMother.random()
      const tokenHash = VerificationTokenTokenHashMother.random()
      const purpose = VerificationTokenPurpose.createAccount()

      const token = VerificationToken.create(id, email, tokenHash, purpose, expiresTtlMs, now)

      expect(token.id).toBe(id)
      expect(token.email).toBe(email)
      expect(token.tokenHash).toBe(tokenHash)
      expect(token.purpose).toBe(purpose)
      expect(token.expiresAt).toEqual(futureExpiresAt)
      expect(token.usedAt).toBeNull()
      expect(token.createdAt).toEqual(now)
    })
  })

  describe('isUsed', () => {
    it('should return true when usedAt is set', () => {
      const token = validTokenBuilder.withUsedAt(now).build()

      expect(token.isUsed()).toBe(true)
    })

    it('should return false when usedAt is null', () => {
      const token = validTokenBuilder.withUsedAt(null).build()

      expect(token.isUsed()).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const token = validTokenBuilder.withExpiresAt(pastExpiresAt).build()

      expect(token.isExpired(now)).toBe(true)
    })

    it('should return true when expiresAt is exactly now', () => {
      const token = validTokenBuilder.withExpiresAt(now).build()

      expect(token.isExpired(now)).toBe(true)
    })

    it('should return false when expiresAt is in the future', () => {
      const token = validTokenBuilder.withExpiresAt(futureExpiresAt).build()

      expect(token.isExpired(now)).toBe(false)
    })
  })

  describe('validate', () => {
    it('should return success when token is valid, active and email and purpose match', () => {
      const validToken = validTokenBuilder.build()
      const result = validToken.validate(now, validEmail, validPurpose)

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
    })

    it('should return alreadyUsed error when token is already used', () => {
      const usedToken = validTokenBuilder.withUsedAt(new Date()).build()

      const result = usedToken.validate(now, validEmail, validPurpose)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(VerificationTokenDomainException.alreadyUsed(usedToken.id.value))
    })

    it('should return alreadyExpired error when token is expired', () => {
      const expiredToken = validTokenBuilder.withExpiresAt(pastExpiresAt).build()

      const result = expiredToken.validate(now, validEmail, validPurpose)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(VerificationTokenDomainException.alreadyExpired(expiredToken.id.value))
    })

    it('should return cannotBeUsedByUser error when the candidate email does not match', () => {
      const otherEmail = EmailAddressMother.random()

      const validToken = validTokenBuilder.build()

      const result = validToken.validate(now, otherEmail, validPurpose)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(VerificationTokenDomainException.cannotBeUsedByUser(validToken.id.value, otherEmail.value))
    })

    it('should return cannotBeUsedForPurpose error when the candidate purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      const validToken = validTokenBuilder.build()

      const result = validToken.validate(now, validEmail, otherPurpose)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        VerificationTokenDomainException.cannotBeUsedForPurpose(validToken.id.value, otherPurpose.value),
      )
    })
  })

  describe('markAsUsed', () => {
    it('should mark as used (set usedAt) when token is valid, active and email and purpose match', () => {
      const validToken = validTokenBuilder.build()

      expect(validToken.usedAt).toBeNull()

      validToken.markAsUsed(now, validEmail, validPurpose)

      expect(validToken.usedAt).toEqual(now)
    })

    it('should throw alreadyUsed error when token is already used', () => {
      const usedAt = new Date(now.getTime() - 1000)
      const usedToken = validTokenBuilder.withUsedAt(usedAt).build()

      expect(() => usedToken.markAsUsed(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyUsed(usedToken.id.value),
      )
      expect(usedToken.usedAt).toEqual(usedAt)
    })

    it('should throw alreadyExpired error when token is expired', () => {
      const expiredToken = validTokenBuilder.withExpiresAt(new Date(now.getTime() - 1000)).build()

      expect(() => expiredToken.markAsUsed(now, validEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.alreadyExpired(expiredToken.id.value),
      )
      expect(expiredToken.usedAt).toBeNull()
    })

    it('should throw cannotBeUsedByUser error when candidate email does not match', () => {
      const otherEmail = EmailAddressMother.random()

      const validToken = validTokenBuilder.build()

      expect(() => validToken.markAsUsed(now, otherEmail, validPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedByUser(validToken.id.value, otherEmail.value),
      )
      expect(validToken.usedAt).toBeNull()
    })

    it('should throw cannotBeUsedForPurpose error when candidate purpose does not match', () => {
      const otherPurpose = VerificationTokenPurpose.resetPassword()

      const validToken = validTokenBuilder.build()

      expect(() => validToken.markAsUsed(now, validEmail, otherPurpose)).toThrow(
        VerificationTokenDomainException.cannotBeUsedForPurpose(validToken.id.value, otherPurpose.value),
      )
      expect(validToken.usedAt).toBeNull()
    })
  })
})
