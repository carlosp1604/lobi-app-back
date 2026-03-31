import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserCredentialRawWitRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('UserCredentialModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw = makeRawUserCredential({
    locked_until: now,
    last_login_at: now,
    created_at: now,
    updated_at: now,
  })

  describe('toDomain', () => {
    const checkResult = (result: UserCredential, raw: UserCredentialRawWitRelationships) => {
      expect(result.userId).toBeInstanceOf(Identifier)
      expect(result.passwordHash).toBeInstanceOf(PasswordHash)

      expect(result.userId.value).toBe(raw.user_id)
      expect(result.passwordHash.value).toBe(raw.password_hash)
      expect(result.failedAttempts).toBe(raw.failed_attempts)
      expect(result.lockedUntil).toEqual(raw.locked_until)
      expect(result.lastLoginAt).toEqual(raw.last_login_at)
      expect(result.createdAt).toEqual(raw.created_at)
      expect(result.updatedAt).toEqual(raw.updated_at)
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const result = UserCredentialModelTranslator.toDomain(baseRaw)

      checkResult(result, baseRaw)
      expect(result.lockedUntil).toEqual(baseRaw.locked_until)
      expect(result.lastLoginAt).toEqual(baseRaw.last_login_at)
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw, locked_until: now, last_login_at: null }

      const result = UserCredentialModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.lockedUntil).toEqual(now)
      expect(result.lastLoginAt).toBeNull()
    })

    it('should propagate errors from ValueObject', () => {
      const invalidId = IdentifierMother.invalid()
      const rawInvalidUserId = { ...baseRaw, user_id: invalidId }

      expect(() => UserCredentialModelTranslator.toDomain(rawInvalidUserId)).toThrow(SharedDomainException.invalidIdentifier(invalidId))
    })

    it('does not mutate input', () => {
      const raw = structuredClone(baseRaw)

      UserCredentialModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let userCredentialTestBuilder: UserCredentialTestBuilder

    const checkDatabaseResult = (result: UserCredentialRawWitRelationships, domain: UserCredential) => {
      expect(result.user_id).toBe(domain.userId.value)
      expect(result.password_hash).toBe(domain.passwordHash.value)
      expect(result.failed_attempts).toBe(domain.failedAttempts)
      expect(result.locked_until).toEqual(domain.lockedUntil)
      expect(result.last_login_at).toEqual(domain.lastLoginAt)
      expect(result.created_at).toEqual(domain.createdAt)
      expect(result.updated_at).toEqual(domain.updatedAt)
    }

    beforeEach(() => {
      userCredentialTestBuilder = new UserCredentialTestBuilder()
        .withUserId(IdentifierMother.valid())
        .withPasswordHash(PasswordHashMother.valid())
        .withFailedAttempts(0)
        .withLockedUntil(null)
        .withLastLoginAt(null)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const userCredential = userCredentialTestBuilder.withLockedUntil(now).withLastLoginAt(now).build()

      const result = UserCredentialModelTranslator.toDatabase(userCredential)

      checkDatabaseResult(result, userCredential)
      expect(result.locked_until).toEqual(now)
      expect(result.last_login_at).toEqual(now)
    })

    it('returns the correct raw model when nullable fields are NULL', () => {
      const userCredential = userCredentialTestBuilder.build()

      const result = UserCredentialModelTranslator.toDatabase(userCredential)

      checkDatabaseResult(result, userCredential)
      expect(result.locked_until).toBeNull()
      expect(result.last_login_at).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const userCredential = userCredentialTestBuilder.withLockedUntil(now).withLastLoginAt(now).build()

      const snapshot = {
        userId: userCredential.userId,
        passwordHash: userCredential.passwordHash,
        failedAttempts: userCredential.failedAttempts,
        lockedUntil: userCredential.lockedUntil,
        lastLoginAt: userCredential.lastLoginAt,
        createdAt: userCredential.createdAt,
        updatedAt: userCredential.updatedAt,
      }

      UserCredentialModelTranslator.toDatabase(userCredential)

      expect(userCredential.userId.equals(snapshot.userId)).toBe(true)
      expect(userCredential.passwordHash.equals(snapshot.passwordHash)).toBe(true)
      expect(userCredential.failedAttempts).toBe(snapshot.failedAttempts)
      expect(userCredential.lockedUntil).toEqual(snapshot.lockedUntil)
      expect(userCredential.lastLoginAt).toEqual(snapshot.lastLoginAt)
      expect(userCredential.createdAt).toEqual(snapshot.createdAt)
      expect(userCredential.updatedAt).toEqual(snapshot.updatedAt)
    })
  })
})
