import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { UserSessionRawModel, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

describe('UserSessionModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)
  const futureExpiresAt = new Date(now.getTime() + 60 * 60 * 1000)

  const validDeviceLocation = DeviceLocationMother.valid()
  const validIpHash = UserIpHashMother.valid()
  const validDeviceInfo = DeviceInfoMother.valid()
  const validSessionId = IdentifierMother.valid()
  const validUserId = IdentifierMother.valid()
  const validTokenHash = UserSessionTokenHashMother.valid()

  let baseRawModel: UserSessionRawWithRelationships

  beforeEach(() => {
    baseRawModel = makeRawSession({
      id: validSessionId.value,
      user_id: validUserId.value,
      token_hash: validTokenHash.value,
      device_country_code: validDeviceLocation.countryCode,
      device_city: validDeviceLocation.city,
      ip_hash: validIpHash.value,
      revoked_at: null,
      device_info: validDeviceInfo.value,
      created_at: now,
      updated_at: now,
      expires_at: futureExpiresAt,
    })
  })

  describe('toDomain', () => {
    const checkResult = (result: UserSession, raw: UserSessionRawModel) => {
      expect(result.id).toBeInstanceOf(Identifier)
      expect(result.userId).toBeInstanceOf(Identifier)
      expect(result.tokenHash).toBeInstanceOf(UserSessionTokenHash)
      expect(result.deviceInfo).toBeInstanceOf(DeviceInfo)

      expect(result.id.equals(validSessionId)).toBe(true)
      expect(result.userId.equals(validUserId)).toBe(true)
      expect(result.tokenHash.equals(validTokenHash)).toBe(true)
      expect(result.deviceInfo.equals(validDeviceInfo)).toBe(true)
      expect(result.expiresAt).toEqual(raw.expires_at)
      expect(result.createdAt).toEqual(raw.created_at)
      expect(result.updatedAt).toEqual(raw.updated_at)
      expect(result.revokedAt).toEqual(raw.revoked_at)

      if (raw.ip_hash === null) {
        expect(result.ipHash).toBeNull()
      } else {
        expect(result.ipHash).toBeInstanceOf(UserIpHash)
        expect(result.ipHash?.equals(validIpHash)).toBe(true)
      }

      if (raw.device_city === null && raw.device_country_code === null) {
        expect(result.deviceLocation).toBeNull()
      } else {
        expect(result.deviceLocation).toBeInstanceOf(DeviceLocation)
        expect(result.deviceLocation?.equals(validDeviceLocation)).toBe(true)
      }
    }

    it('should return the correct domain object when nullable fields are not NULL', () => {
      const rawModel = { ...baseRawModel, revoked_at: now }

      const result = UserSessionModelTranslator.toDomain(rawModel)

      checkResult(result, rawModel)

      expect(result.revokedAt).toEqual(rawModel.revoked_at)
      expect(result.ipHash).not.toBeNull()
      expect(result.deviceLocation).not.toBeNull()
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const rawModel = {
        ...baseRawModel,
        revoked_at: null,
        ip_hash: null,
        device_country_code: null,
        device_city: null,
      }

      const result = UserSessionModelTranslator.toDomain(rawModel)

      checkResult(result, rawModel)

      expect(result.revokedAt).toBeNull()
      expect(result.ipHash).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should throw error if device location data is partial (city is null)', () => {
      const rawModel: UserSessionRawModel = {
        ...baseRawModel,
        device_country_code: validDeviceLocation.countryCode,
        device_city: null,
      }

      expect(() => UserSessionModelTranslator.toDomain(rawModel)).toThrow(UserSessionDomainException.invalidDeviceCity(''))
    })

    it('should throw error if device location data is partial (countryCode is null)', () => {
      const rawModel = {
        ...baseRawModel,
        device_country_code: null,
        device_city: validDeviceLocation.city,
      }

      expect(() => UserSessionModelTranslator.toDomain(rawModel)).toThrow(UserSessionDomainException.invalidDeviceCountryCode(''))
    })

    it('does not mutate the input raw model', () => {
      const rawModel = structuredClone(baseRawModel)

      UserSessionModelTranslator.toDomain(rawModel)

      expect(rawModel).toEqual(baseRawModel)
    })
  })

  describe('toDatabase', () => {
    let sessionBuilder: UserSessionTestBuilder
    const validDeviceLocation = DeviceLocationMother.valid()
    const validIpHash = UserIpHashMother.valid()

    const checkResult = (result: UserSessionRawModel, domain: UserSession) => {
      expect(result.id).toBe(domain.id.value)
      expect(result.user_id).toBe(domain.userId.value)
      expect(result.token_hash).toBe(domain.tokenHash.value)
      expect(result.expires_at).toEqual(domain.expiresAt)
      expect(result.created_at).toEqual(domain.createdAt)
      expect(result.updated_at).toEqual(domain.updatedAt)
      expect(result.device_info).toEqual(domain.deviceInfo.value)
      expect(result.revoked_at).toEqual(domain.revokedAt)

      if (domain.ipHash === null) {
        expect(result.ip_hash).toBeNull()
        expect(domain.ipHash).toBeNull()
      } else {
        expect(result.ip_hash).toBe(domain.ipHash.value)
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
        .withId(IdentifierMother.valid())
        .withUserId(IdentifierMother.valid())
        .withTokenHash(UserSessionTokenHashMother.valid())
        .withExpiresAt(futureExpiresAt)
        .withRevokedAt(null)
        .withIpHash(validIpHash)
        .withDeviceInfo(DeviceInfoMother.valid())
        .withDeviceLocation(validDeviceLocation)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should return the correct raw model when nullable fields are not NULL', () => {
      const session = sessionBuilder.withRevokedAt(now).build()

      const result = UserSessionModelTranslator.toDatabase(session)

      checkResult(result, session)
      expect(result.revoked_at).toEqual(now)
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
        deviceInfo: session.deviceInfo,
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
      expect(session.deviceInfo.equals(snapshot.deviceInfo)).toBe(true)
      expect(session.expiresAt).toEqual(snapshot.expiresAt)
      expect(session.revokedAt).toEqual(snapshot.revokedAt)
      expect(session.createdAt).toEqual(snapshot.createdAt)
      expect(session.updatedAt).toEqual(snapshot.updatedAt)
    })
  })
})
