import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

describe('UserSessionModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)
  const futureExpiresAt = new Date(now.getTime() + 60 * 60 * 1000)

  const baseRaw = makeRawSession({
    device_country_code: 'ES',
    device_city: 'Murcia',
    created_at: now,
    updated_at: now,
    ip_hash: UserSessionIpHashMother.valid().toString(),
    revoked_at: null,
    expires_at: futureExpiresAt,
  })

  describe('toDomain', () => {
    const checkResult = (result: UserSession, raw: UserSessionRawModel) => {
      expect(result.id).toBeInstanceOf(UserSessionId)
      expect(result.userId).toBeInstanceOf(UserId)
      expect(result.tokenHash).toBeInstanceOf(UserSessionTokenHash)
      expect(result.userAgent).toBeInstanceOf(UserAgent)

      expect(result.id.toString()).toBe(raw.id)
      expect(result.userId.toString()).toBe(raw.user_id)
      expect(result.tokenHash.toString()).toBe(raw.token_hash)
      expect(result.userAgent.toString()).toBe(raw.user_agent)
      expect(result.expiresAt.getTime()).toBe(raw.expires_at.getTime())
      expect(result.createdAt.getTime()).toBe(raw.created_at.getTime())
      expect(result.updatedAt.getTime()).toBe(raw.updated_at.getTime())
      expect(result.revokedAt).toEqual(raw.revoked_at)

      if (raw.ip_hash === null) {
        expect(result.ipHash).toBeNull()
      } else {
        expect(result.ipHash).toBeInstanceOf(UserSessionIpHash)
        expect(result.ipHash?.toString()).toBe(raw.ip_hash)
      }

      if (raw.device_city === null && raw.device_country_code === null) {
        expect(result.deviceLocation).toBeNull()
      } else {
        expect(result.deviceLocation).toBeInstanceOf(DeviceLocation)
        expect(result.deviceLocation?.city).toBe(raw.device_city)
        expect(result.deviceLocation?.countryCode).toBe(raw.device_country_code)
      }
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw, revoked_at: now }

      const result = UserSessionModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.revokedAt?.getTime()).toBe(raw.revoked_at.getTime())
      expect(result.ipHash).not.toBeNull()
      expect(result.deviceLocation).not.toBeNull()
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        revoked_at: null,
        ip_hash: null,
        device_country_code: null,
        device_city: null,
      }

      const result = UserSessionModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.revokedAt).toBeNull()
      expect(result.ipHash).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should throw error if device location data is partial (city is null)', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        device_country_code: 'ES',
        device_city: null,
      }

      expect(() => UserSessionModelTranslator.toDomain(raw)).toThrow(UserSessionDomainException.invalidDeviceCity(''))
    })

    it('should throw error if device location data is partial (countryCode is null)', () => {
      const raw: UserSessionRawModel = {
        ...baseRaw,
        device_country_code: null,
        device_city: 'Madrid',
      }

      expect(() => UserSessionModelTranslator.toDomain(raw)).toThrow(UserSessionDomainException.invalidDeviceCountryCode(''))
    })

    it('does not mutate the input raw model', () => {
      const raw = structuredClone(baseRaw)

      UserSessionModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let sessionBuilder: UserSessionTestBuilder
    const validDeviceLocation = DeviceLocationMother.valid()
    const validIpHash = UserSessionIpHashMother.valid()

    const checkResult = (result: UserSessionRawModel, domain: UserSession) => {
      expect(result.id).toBe(domain.id.toString())
      expect(result.user_id).toBe(domain.userId.toString())
      expect(result.token_hash).toBe(domain.tokenHash.toString())
      expect(result.expires_at.getTime()).toBe(domain.expiresAt.getTime())
      expect(result.created_at.getTime()).toBe(domain.createdAt.getTime())
      expect(result.updated_at.getTime()).toBe(domain.updatedAt.getTime())
      expect(result.user_agent).toBe(domain.userAgent.toString())
      expect(result.revoked_at).toEqual(domain.revokedAt)

      if (domain.ipHash === null) {
        expect(result.ip_hash).toBeNull()
        expect(domain.ipHash).toBeNull()
      } else {
        expect(result.ip_hash).toBe(domain.ipHash.toString())
      }

      if (domain.deviceLocation === null) {
        expect(result.device_city).toBeNull()
        expect(result.device_country_code).toBeNull()
        expect(domain.deviceLocation).toBeNull()
      } else {
        expect(result.device_city).toBe(domain.deviceLocation.city)
        expect(result.device_country_code).toBe(domain.deviceLocation.countryCode)
      }
    }

    beforeEach(() => {
      sessionBuilder = new UserSessionTestBuilder()
        .withId(UserSessionIdMother.valid())
        .withUserId(UserIdMother.valid())
        .withTokenHash(UserSessionTokenHashMother.valid())
        .withExpiresAt(futureExpiresAt)
        .withRevokedAt(null)
        .withIpHash(validIpHash)
        .withUserAgent(UserAgentMother.valid())
        .withDeviceLocation(validDeviceLocation)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const session = sessionBuilder.withRevokedAt(now).build()

      const result = UserSessionModelTranslator.toDatabase(session)

      checkResult(result, session)
      expect(result.revoked_at?.getTime()).toBe(now.getTime())
      expect(result.ip_hash).not.toBeNull()
      expect(result.device_city).not.toBeNull()
      expect(result.device_country_code).not.toBeNull()
    })

    it('should return the correct raw model when nullable fields are NULL', () => {
      const session = sessionBuilder.withRevokedAt(null).withIpHash(null).withDeviceLocation(null).build()

      const result = UserSessionModelTranslator.toDatabase(session)

      checkResult(result, session)
      expect(result.revoked_at).toBeNull()
      expect(result.ip_hash).toBeNull()
      expect(result.device_city).toBeNull()
      expect(result.device_country_code).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const session = sessionBuilder.withRevokedAt(now).build()

      const snapshot = {
        id: session.id,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        ipHash: session.ipHash,
        userAgent: session.userAgent,
        deviceLocation: session.deviceLocation,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }

      UserSessionModelTranslator.toDatabase(session)

      expect(session.id.equals(snapshot.id)).toBe(true)
      expect(session.userId.equals(snapshot.userId)).toBe(true)
      expect(session.tokenHash.equals(snapshot.tokenHash)).toBe(true)
      expect(session.ipHash?.equals(snapshot.ipHash)).toBe(true)
      expect(session.deviceLocation?.equals(snapshot.deviceLocation)).toBe(true)
      expect(session.userAgent.equals(snapshot.userAgent)).toBe(true)
      expect(session.expiresAt.getTime()).toBe(snapshot.expiresAt.getTime())
      expect(session.revokedAt?.getTime()).toBe(snapshot.revokedAt?.getTime())
      expect(session.createdAt.getTime()).toBe(snapshot.createdAt.getTime())
      expect(session.updatedAt.getTime()).toBe(snapshot.updatedAt.getTime())
    })
  })
})
