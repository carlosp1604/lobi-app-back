import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

describe('UserSession', () => {
  const now = new Date('2025-01-02T03:04:05.000Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const pastExpiredAt = new Date(now.getTime() - 3600)
  const revokedAt = new Date(now.getTime() - 1000)

  describe('create', () => {
    const expiresTtlMs = 10000
    const futureExpiresAt = new Date(now.getTime() + expiresTtlMs)

    const id = IdentifierMother.valid()
    const userId = IdentifierMother.valid()
    const tokenHash = UserSessionTokenHashMother.valid()
    const userAgent = UserAgentMother.valid()

    it('should initialize the UserSession instance correctly', () => {
      const userSessionIpHash: UserSessionIpHash = UserSessionIpHashMother.valid()
      const deviceLocation = DeviceLocationMother.valid()

      const session = UserSession.create(id, userId, tokenHash, userAgent, expiresTtlMs, now, userSessionIpHash, deviceLocation)

      expect(session.id.equals(id)).toBe(true)
      expect(session.userId.equals(userId)).toBe(true)
      expect(session.tokenHash.equals(tokenHash)).toBe(true)
      expect(session.expiresAt).toEqual(futureExpiresAt)
      expect(session.revokedAt).toBeNull()
      expect(session.ipHash?.equals(userSessionIpHash)).toBe(true)
      expect(session.userAgent?.equals(userAgent)).toBe(true)
      expect(session.deviceLocation?.equals(deviceLocation)).toBe(true)
      expect(session.createdAt).toEqual(now)
      expect(session.updatedAt).toBe(now)
    })

    it('should set to NULL when optional params are not given', () => {
      const session = UserSession.create(id, userId, tokenHash, userAgent, expiresTtlMs, now, null, null)

      expect(session.ipHash).toBeNull()
      expect(session.deviceLocation).toBeNull()
    })
  })

  describe('revoke', () => {
    let userSessionTestBuilder: UserSessionTestBuilder

    beforeEach(() => {
      userSessionTestBuilder = new UserSessionTestBuilder()
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withRevokedAt(null)
        .withExpiresAt(futureExpiresAt)
    })

    it('should revoke session correctly', () => {
      const session = userSessionTestBuilder.build()

      session.revoke(now)

      expect(session.revokedAt).toBe(now)
      expect(session.updatedAt).toBe(now)
    })

    it('should throw UserSessionDomainException when the session is already revoked', () => {
      const revokedSession = userSessionTestBuilder.withRevokedAt(revokedAt).build()

      expect(() => revokedSession.revoke(now)).toThrow(UserSessionDomainException.sessionAlreadyRevoked(revokedSession.id.value))
    })

    it('should throw UserSessionDomainException when the session is already expired', () => {
      const expiredSession = userSessionTestBuilder.withExpiresAt(pastExpiredAt).build()

      expect(() => expiredSession.revoke(now)).toThrow(UserSessionDomainException.sessionAlreadyExpired(expiredSession.id.value))
    })
  })

  describe('canBeRevoked', () => {
    let userSessionTestBuilder: UserSessionTestBuilder

    beforeEach(() => {
      userSessionTestBuilder = new UserSessionTestBuilder()
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withRevokedAt(null)
        .withExpiresAt(futureExpiresAt)
    })

    it('should return success when session can be revoked', () => {
      const session = userSessionTestBuilder.build()

      const result = session.canBeRevoked(now)

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
    })

    it('should return UserSessionDomainException error when session is already revoked', () => {
      const revokedSession = userSessionTestBuilder.withRevokedAt(revokedAt).build()

      const result = revokedSession.canBeRevoked(now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(UserSessionDomainException.sessionAlreadyRevoked(revokedSession.id.value))
    })

    it('should return UserSessionDomainException error when session is already expired', () => {
      const expiredSession = userSessionTestBuilder.withExpiresAt(pastExpiredAt).build()

      const result = expiredSession.canBeRevoked(now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(UserSessionDomainException.sessionAlreadyExpired(expiredSession.id.value))
    })
  })

  describe('isSameDeviceAs', () => {
    const userAgent1 = UserAgentMother.valid()
    const userAgent2 = UserAgentMother.random()
    const ip1 = UserSessionIpHashMother.valid()
    const ip2 = UserSessionIpHashMother.random()

    const createSession = (userAgent: UserAgent, ip: UserSessionIpHash | null): UserSession => {
      return new UserSessionTestBuilder().withUserAgent(userAgent).withIpHash(ip).build()
    }

    it('should return true when IP and UserAgent match', () => {
      const session1 = createSession(userAgent1, ip1)
      const session2 = createSession(userAgent1, ip1)

      expect(session1.isSameDeviceAs(session2)).toBe(true)
    })

    it('should return false when UserAgent matches but IP does not match', () => {
      const session1 = createSession(userAgent1, ip1)
      const session2 = createSession(userAgent1, ip2)

      expect(session1.isSameDeviceAs(session2)).toBe(false)
    })

    it('should return false when IP matches but UserAgent does not match', () => {
      const session1 = createSession(userAgent1, ip1)
      const session2 = createSession(userAgent2, ip1)

      expect(session1.isSameDeviceAs(session2)).toBe(false)
    })

    it('should return true when UserAgent matches and IPs are null', () => {
      const session1 = createSession(userAgent1, null)
      const session2 = createSession(userAgent1, null)

      expect(session1.isSameDeviceAs(session2)).toBe(true)
    })

    it('should return false when UserAgent does not match and IPs are null', () => {
      const session1 = createSession(userAgent1, null)
      const session2 = createSession(userAgent2, null)

      expect(session1.isSameDeviceAs(session2)).toBe(false)
    })

    it('should return false when one IP is null and the other is not', () => {
      const session1 = createSession(userAgent1, ip1)
      const session2 = createSession(userAgent1, null)

      expect(session1.isSameDeviceAs(session2)).toBe(false)
    })

    it('should return false when one IP is null and the other is not (reversed)', () => {
      const session1 = createSession(userAgent1, null)
      const session2 = createSession(userAgent1, ip1)

      expect(session1.isSameDeviceAs(session2)).toBe(false)
    })
  })

  describe('isRevoked', () => {
    it('should return true when revokedAt is not null', () => {
      const session = new UserSessionTestBuilder().withRevokedAt(revokedAt).build()

      expect(session.isRevoked()).toBe(true)
    })

    it('should return false when revokedAt is null', () => {
      const session = new UserSessionTestBuilder().withRevokedAt(null).build()

      expect(session.isRevoked()).toBe(false)
    })
  })

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const session = new UserSessionTestBuilder().withExpiresAt(pastExpiredAt).build()

      expect(session.isExpired(now)).toBe(true)
    })

    it('should return true when expiresAt is exactly now', () => {
      const session = new UserSessionTestBuilder().withExpiresAt(now).build()

      expect(session.isExpired(now)).toBe(true)
    })

    it('should return false when expiresAt is in the future', () => {
      const session = new UserSessionTestBuilder().withExpiresAt(futureExpiresAt).build()

      expect(session.isExpired(now)).toBe(false)
    })
  })
})
