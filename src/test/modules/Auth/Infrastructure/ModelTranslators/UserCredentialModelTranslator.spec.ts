import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/UserCredential.entity'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'

describe('UserCredentialModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw: UserCredentialRawModel = {
    user_id: UserIdMother.valid().toString().toString(),
    password_hash: PasswordHashMother.valid().toString(),
    failed_attempts: 0,
    locked_until: null,
    last_login_at: now,
    created_at: now,
    updated_at: now,
  }

  describe('toDomain', () => {
    it('returns correct data', () => {
      const result = UserCredentialModelTranslator.toDomain(baseRaw)

      expect(result.userId.toString()).toBe(baseRaw.user_id)
      expect(result.passwordHash.toString()).toBe(baseRaw.password_hash)
      expect(result.failedAttempts).toBe(baseRaw.failed_attempts)
      expect(result.lockedUntil).toBeNull()
      expect(result.lastLoginAt?.toISOString()).toBe(isoDate)
      expect(result.createdAt.toISOString()).toBe(isoDate)
      expect(result.updatedAt.toISOString()).toBe(isoDate)
    })

    it('returns correct data when locked_until or last_login_at are NULL', () => {
      const raw = { ...baseRaw, locked_until: now, last_login_at: null }

      const result = UserCredentialModelTranslator.toDomain(raw)

      expect(result.lockedUntil?.toISOString()).toBe(isoDate)
      expect(result.lastLoginAt).toBeNull()
    })

    it('does not mutate input', () => {
      const raw = structuredClone(baseRaw)

      UserCredentialModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let userCredentialTestBuilder = new UserCredentialTestBuilder()

    beforeEach(() => {
      userCredentialTestBuilder = new UserCredentialTestBuilder()
        .withUserId(UserIdMother.valid())
        .withPasswordHash(PasswordHashMother.valid())
        .withFailedAttempts(0)
        .withLockedUntil(now)
        .withLastLoginAt(now)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('returns correct data', () => {
      const userCredential = userCredentialTestBuilder.build()
      const row = UserCredentialModelTranslator.toDatabase(userCredential)

      expect(row).toEqual({
        user_id: userCredential.userId.toString(),
        password_hash: userCredential.passwordHash.toString(),
        failed_attempts: userCredential.failedAttempts,
        locked_until: now,
        last_login_at: now,
        created_at: now,
        updated_at: now,
      })
    })

    it('returns correct data when failed_attempts or locked_until are NULL', () => {
      const userCredential = userCredentialTestBuilder.withLockedUntil(null).withLastLoginAt(null).build()

      const row = UserCredentialModelTranslator.toDatabase(userCredential)

      expect(row.locked_until).toBeNull()
      expect(row.last_login_at).toBeNull()
    })

    it('does not mutate input', () => {
      const userCredential = userCredentialTestBuilder.build()

      const snapshot = {
        userId: userCredential.userId.toString(),
        passwordHash: userCredential.passwordHash.toString(),
        failedAttempts: userCredential.failedAttempts,
        lockedUntil: userCredential.lockedUntil,
        lastLoginAt: userCredential.lastLoginAt,
        createdAt: userCredential.createdAt,
        updatedAt: userCredential.updatedAt,
      }

      UserCredentialModelTranslator.toDatabase(userCredential)

      expect(userCredential.userId.toString()).toBe(snapshot.userId)
      expect(userCredential.passwordHash.toString()).toBe(snapshot.passwordHash)
      expect(userCredential.failedAttempts).toBe(snapshot.failedAttempts)
      expect(userCredential.lockedUntil).toBe(snapshot.lockedUntil)
      expect(userCredential.lastLoginAt).toBe(snapshot.lastLoginAt)
      expect(userCredential.createdAt).toBe(snapshot.createdAt)
      expect(userCredential.updatedAt).toBe(snapshot.updatedAt)
    })
  })
})
