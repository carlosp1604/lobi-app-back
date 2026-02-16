import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserCredentialRawWitRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

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
      expect(result.userId).toBeInstanceOf(UserId)
      expect(result.passwordHash).toBeInstanceOf(PasswordHash)

      expect(result.userId.value).toBe(raw.user_id)
      expect(result.passwordHash.value).toBe(raw.password_hash)
      expect(result.failedAttempts).toBe(raw.failed_attempts)
      expect(result.lockedUntil).toEqual(raw.locked_until)
      expect(result.lastLoginAt).toEqual(raw.last_login_at)
      expect(result.createdAt.getTime()).toBe(raw.created_at.getTime())
      expect(result.updatedAt.getTime()).toBe(raw.updated_at.getTime())
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const result = UserCredentialModelTranslator.toDomain(baseRaw)

      checkResult(result, baseRaw)
      expect(result.lockedUntil?.getTime()).toBe(baseRaw.locked_until?.getTime())
      expect(result.lastLoginAt?.getTime()).toBe(baseRaw.last_login_at?.getTime())
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw, locked_until: now, last_login_at: null }

      const result = UserCredentialModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.lockedUntil?.toISOString()).toBe(isoDate)
      expect(result.lastLoginAt).toBeNull()
    })

    it('should propagate errors from ValueObject', () => {
      const rawInvalidUserId = { ...baseRaw, user_id: 'not-an-id' }

      expect(() => UserCredentialModelTranslator.toDomain(rawInvalidUserId)).toThrow(UserDomainException.invalidUserId('not-an-id'))
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
      expect(result.created_at.getTime()).toBe(domain.createdAt.getTime())
      expect(result.updated_at.getTime()).toBe(domain.updatedAt.getTime())
    }

    beforeEach(() => {
      userCredentialTestBuilder = new UserCredentialTestBuilder()
        .withUserId(UserIdMother.valid())
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
      expect(result.locked_until?.getTime()).toBe(now.getTime())
      expect(result.last_login_at?.getTime()).toBe(now.getTime())
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
      expect(userCredential.lockedUntil?.getTime()).toBe(snapshot.lockedUntil?.getTime())
      expect(userCredential.lastLoginAt?.getTime()).toBe(snapshot.lastLoginAt?.getTime())
      expect(userCredential.createdAt.getTime()).toBe(snapshot.createdAt.getTime())
      expect(userCredential.updatedAt.getTime()).toBe(snapshot.updatedAt.getTime())
    })
  })
})
