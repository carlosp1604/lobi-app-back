import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionRaw } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'

describe('UserSessionModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw: UserSessionRaw = {
    id: UserSessionIdMother.valid().toString(),
    user_id: UserIdMother.valid().toString(),
    token_hash: UserSessionHashMother.valid().toString(),
    expires_at: now,
    revoked_at: null,
    ip_hash: UserSessionIpHashMother.valid().toString(),
    user_agent: UserAgentMother.valid().toString(),
    device_country: 'ES',
    device_city: 'Madrid',
    device_timezone: 'Europe/Madrid',
    created_at: now,
    updated_at: now,
  }

  describe('toDomain', () => {
    it('returns correct data', () => {
      const result = UserSessionModelTranslator.toDomain(baseRaw)

      expect(result.id.toString()).toBe(baseRaw.id)
      expect(result.userId.toString()).toBe(baseRaw.user_id)
      expect(result.tokenHash.toString()).toBe(baseRaw.token_hash)
      expect(result.expiresAt.toISOString()).toBe(isoDate)
      expect(result.revokedAt).toBeNull()
      expect(result.ipHash?.toString()).toBe(baseRaw.ip_hash)
      expect(result.userAgent?.toString()).toBe(baseRaw.user_agent)
      expect(result.deviceCountry).toBe('ES')
      expect(result.deviceCity).toBe('Madrid')
      expect(result.deviceTimezone).toBe('Europe/Madrid')
      expect(result.createdAt.toISOString()).toBe(isoDate)
      expect(result.updatedAt.toISOString()).toBe(isoDate)
    })

    it('returns correct data when nullable fields are null', () => {
      const raw: UserSessionRaw = {
        ...baseRaw,
        revoked_at: null,
        ip_hash: null,
        user_agent: null,
        device_country: null,
        device_city: null,
        device_timezone: null,
      }

      const result = UserSessionModelTranslator.toDomain(raw)

      expect(result.revokedAt).toBeNull()
      expect(result.ipHash).toBeNull()
      expect(result.userAgent).toBeNull()
      expect(result.deviceCountry).toBeNull()
      expect(result.deviceCity).toBeNull()
      expect(result.deviceTimezone).toBeNull()
    })

    it('does not mutate input', () => {
      const raw = structuredClone(baseRaw)

      UserSessionModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let sessionBuilder = new UserSessionTestBuilder()

    beforeEach(() => {
      sessionBuilder = new UserSessionTestBuilder()
        .withId(UserSessionIdMother.valid())
        .withUserId(UserIdMother.valid())
        .withTokenHash(UserSessionHashMother.valid())
        .withExpiresAt(now)
        .withRevokedAt(null)
        .withIpHash(UserSessionIpHashMother.valid())
        .withUserAgent(UserAgentMother.valid())
        .withDeviceCountry('ES')
        .withDeviceCity('Madrid')
        .withDeviceTimezone('Europe/Madrid')
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('returns correct data', () => {
      const session = sessionBuilder.build()

      const raw = UserSessionModelTranslator.toDatabase(session)

      expect(raw).toEqual({
        id: session.id.toString(),
        user_id: session.userId.toString(),
        token_hash: session.tokenHash.toString(),
        expires_at: now,
        revoked_at: null,
        ip_hash: session.ipHash?.toString(),
        user_agent: session.userAgent?.toString(),
        device_country: 'ES',
        device_city: 'Madrid',
        device_timezone: 'Europe/Madrid',
        created_at: now,
        updated_at: now,
      })
    })

    it('returns correct data when nullable fields are null', () => {
      const session = sessionBuilder
        .withRevokedAt(null)
        .withIpHash(null)
        .withUserAgent(null)
        .withDeviceCountry(null)
        .withDeviceCity(null)
        .withDeviceTimezone(null)
        .build()

      const raw = UserSessionModelTranslator.toDatabase(session)

      expect(raw.revoked_at).toBeNull()
      expect(raw.ip_hash).toBeNull()
      expect(raw.user_agent).toBeNull()
      expect(raw.device_country).toBeNull()
      expect(raw.device_city).toBeNull()
      expect(raw.device_timezone).toBeNull()
    })

    it('does not mutate input', () => {
      const session = sessionBuilder.build()

      const snapshot = {
        id: session.id.toString(),
        userId: session.userId.toString(),
        token_hash: session.tokenHash.toString(),
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        ipHash: session.ipHash?.toString(),
        userAgent: session.userAgent?.toString(),
        deviceCountry: session.deviceCountry,
        deviceCity: session.deviceCity,
        deviceTimezone: session.deviceTimezone,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }

      UserSessionModelTranslator.toDatabase(session)

      expect(session.id.toString()).toBe(snapshot.id)
      expect(session.userId.toString()).toBe(snapshot.userId)
      expect(session.tokenHash.toString()).toBe(snapshot.token_hash)
      expect(session.expiresAt).toBe(snapshot.expiresAt)
      expect(session.revokedAt).toBe(snapshot.revokedAt)
      expect(session.ipHash?.toString()).toBe(snapshot.ipHash)
      expect(session.userAgent?.toString()).toBe(snapshot.userAgent)
      expect(session.deviceCountry).toBe(snapshot.deviceCountry)
      expect(session.deviceCity).toBe(snapshot.deviceCity)
      expect(session.deviceTimezone).toBe(snapshot.deviceTimezone)
      expect(session.createdAt).toBe(snapshot.createdAt)
      expect(session.updatedAt).toBe(snapshot.updatedAt)
    })
  })
})
