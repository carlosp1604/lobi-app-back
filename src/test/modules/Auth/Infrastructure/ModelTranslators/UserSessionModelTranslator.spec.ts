import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

describe('UserSessionModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw = makeRawSession({
    device_country_code: 'ES',
    device_city: 'Madrid',
    created_at: now,
    updated_at: now,
    ip_hash: UserSessionIpHashMother.valid().toString(),
    revoked_at: null,
    expires_at: now,
  })

  describe('toDomain', () => {
    it('returns rhe correct data', () => {
      const result = UserSessionModelTranslator.toDomain(baseRaw)

      expect(result.id.toString()).toBe(baseRaw.id)
      expect(result.userId.toString()).toBe(baseRaw.user_id)
      expect(result.tokenHash.toString()).toBe(baseRaw.token_hash)
      expect(result.expiresAt.toISOString()).toBe(isoDate)
      expect(result.revokedAt).toBeNull()
      expect(result.ipHash?.toString()).toBe(baseRaw.ip_hash)
      expect(result.userAgent?.toString()).toBe(baseRaw.user_agent)
      expect(result.deviceLocation?.countryCode).toBe('ES')
      expect(result.deviceLocation?.city).toBe('Madrid')
      expect(result.createdAt.toISOString()).toBe(isoDate)
      expect(result.updatedAt.toISOString()).toBe(isoDate)
    })

    it('returns the correct data when nullable fields are null', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        revoked_at: null,
        ip_hash: null,
        device_country_code: null,
        device_city: null,
      }

      const result = UserSessionModelTranslator.toDomain(raw)

      expect(result.revokedAt).toBeNull()
      expect(result.ipHash).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('does not mutate input', () => {
      const raw = structuredClone(baseRaw)

      UserSessionModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let sessionBuilder = new UserSessionTestBuilder()
    const validDeviceLocation = DeviceLocationMother.valid()

    beforeEach(() => {
      sessionBuilder = new UserSessionTestBuilder()
        .withId(UserSessionIdMother.valid())
        .withUserId(UserIdMother.valid())
        .withTokenHash(UserSessionHashMother.valid())
        .withExpiresAt(now)
        .withRevokedAt(null)
        .withIpHash(UserSessionIpHashMother.valid())
        .withUserAgent(UserAgentMother.valid())
        .withDeviceLocation(validDeviceLocation)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('returns the correct data', () => {
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
        device_country_code: validDeviceLocation.countryCode,
        device_city: validDeviceLocation.city,
        created_at: now,
        updated_at: now,
      })
    })

    it('returns correct data when nullable fields are null', () => {
      const session = sessionBuilder.withRevokedAt(null).withIpHash(null).withDeviceLocation(null).build()

      const raw = UserSessionModelTranslator.toDatabase(session)

      expect(raw.revoked_at).toBeNull()
      expect(raw.ip_hash).toBeNull()
      expect(raw.device_country_code).toBeNull()
      expect(raw.device_city).toBeNull()
    })

    it('should throw an error if device location data is partial (city is null)', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        device_country_code: 'ES',
        device_city: null,
      }

      expect(() => UserSessionModelTranslator.toDomain(raw)).toThrow(UserSessionDomainException.invalidDeviceCity(''))
    })

    it('should throw an error if device location data is partial (countryCode is null)', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        device_country_code: null,
        device_city: 'Madrid',
      }

      expect(() => UserSessionModelTranslator.toDomain(raw)).toThrow(UserSessionDomainException.invalidDeviceCountryCode(''))
    })

    it('does not mutate input', () => {
      const session = sessionBuilder.build()

      const snapshot = {
        id: session.id.toString(),
        userId: session.userId.toString(),
        tokenHash: session.tokenHash.toString(),
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        ipHash: session.ipHash?.toString(),
        userAgent: session.userAgent?.toString(),
        deviceCountryCode: session.deviceLocation?.countryCode,
        deviceCity: session.deviceLocation?.city,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }

      UserSessionModelTranslator.toDatabase(session)

      expect(session.id.toString()).toBe(snapshot.id)
      expect(session.userId.toString()).toBe(snapshot.userId)
      expect(session.tokenHash.toString()).toBe(snapshot.tokenHash)
      expect(session.expiresAt).toBe(snapshot.expiresAt)
      expect(session.revokedAt).toBe(snapshot.revokedAt)
      expect(session.ipHash?.toString()).toBe(snapshot.ipHash)
      expect(session.userAgent?.toString()).toBe(snapshot.userAgent)
      expect(session.deviceLocation?.countryCode).toBe(snapshot.deviceCountryCode)
      expect(session.deviceLocation?.city).toBe(snapshot.deviceCity)
      expect(session.createdAt).toBe(snapshot.createdAt)
      expect(session.updatedAt).toBe(snapshot.updatedAt)
    })
  })
})
