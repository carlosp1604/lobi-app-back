import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

describe('UserSession', () => {
  describe('create', () => {
    const now = new Date('2025-01-02T03:04:05.000Z')
    const expiresAt = new Date('2025-02-02T03:04:05.000Z')

    const id = UserSessionIdMother.valid()
    const userId = UserIdMother.valid()
    const tokenHash = UserSessionTokenHashMother.valid()
    const userAgent = UserAgentMother.valid()

    it('should initialize the UserSession instance correctly', () => {
      const userSessionIpHash: UserSessionIpHash = UserSessionIpHashMother.valid()
      const deviceLocation = DeviceLocationMother.valid()

      const session = UserSession.create(id, userId, tokenHash, userAgent, expiresAt, now, userSessionIpHash, deviceLocation)

      expect(session.id.equals(id)).toBe(true)
      expect(session.userId.equals(userId)).toBe(true)
      expect(session.tokenHash.equals(tokenHash)).toBe(true)
      expect(session.expiresAt.getTime()).toBe(expiresAt.getTime())
      expect(session.revokedAt).toBeNull()
      expect(session.ipHash?.equals(userSessionIpHash)).toBe(true)
      expect(session.userAgent?.equals(userAgent)).toBe(true)
      expect(session.deviceLocation).toBe(deviceLocation)
      expect(session.createdAt.getTime()).toBe(now.getTime())
      expect(session.updatedAt.getTime()).toBe(now.getTime())
    })

    it('should set to NULL when optional params are not given', () => {
      const session = UserSession.create(id, userId, tokenHash, userAgent, expiresAt, now, null, null)

      expect(session.ipHash).toBeNull()
      expect(session.deviceLocation).toBeNull()
    })
  })

  describe('revoke', () => {
    let userSessionTestBuilder: UserSessionTestBuilder
    const now = new Date('2025-10-20T17:30:00Z')
    const expiresAt = new Date(now.getTime() + 3600)
    const alreadyExpiredAt = new Date(now.getTime() - 3600)
    const alreadyRevokedAt = new Date(now.getTime() - 1000)

    beforeEach(() => {
      userSessionTestBuilder = new UserSessionTestBuilder()
        .withId(UserSessionIdMother.valid())
        .withUserId(UserIdMother.valid())
        .withTokenHash(UserSessionTokenHashMother.valid())
        .withUserAgent(UserAgentMother.valid())
        .withIpHash(null)
        .withDeviceLocation(null)
        .withCreatedAt(now)
        .withUpdatedAt(now)
    })

    it('should correctly set the revokedAt date on an active session', () => {
      const session = userSessionTestBuilder.withExpiresAt(expiresAt).withRevokedAt(null).build()

      session.revoke(now)

      expect(session.revokedAt).toBe(now)
    })

    it('should throw UserSessionDomainException if the session is already revoked', () => {
      const session = userSessionTestBuilder.withExpiresAt(expiresAt).withRevokedAt(alreadyRevokedAt).build()

      expect(() => session.revoke(now)).toThrow(UserSessionDomainException.sessionAlreadyRevoked(session.id.toString()))
    })

    it('should throw UserSessionDomainException if the session is already expired', () => {
      const session = userSessionTestBuilder.withExpiresAt(alreadyExpiredAt).withRevokedAt(null).build()

      expect(() => session.revoke(now)).toThrow(UserSessionDomainException.sessionAlreadyExpired(session.id.toString()))
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
    const now = new Date('2025-10-20T22:00:00Z')

    it('should return true when revokedAt is not null', () => {
      const revokedDate = new Date(now.getTime() - 1000)
      const session = new UserSessionTestBuilder().withRevokedAt(revokedDate).build()

      expect(session.isRevoked()).toBe(true)
    })

    it('should return false when revokedAt is null', () => {
      const session = new UserSessionTestBuilder().withRevokedAt(null).build()

      expect(session.isRevoked()).toBe(false)
    })
  })

  describe('isExpired', () => {
    const now = new Date('2025-10-20T22:00:00Z')

    it('should return true when expiresAt is in the past', () => {
      const pastDate = new Date(now.getTime() - 1000)
      const session = new UserSessionTestBuilder().withExpiresAt(pastDate).build()

      expect(session.isExpired(now)).toBe(true)
    })

    it('should return true when expiresAt is exactly now', () => {
      const session = new UserSessionTestBuilder().withExpiresAt(now).build()

      expect(session.isExpired(now)).toBe(true)
    })

    it('should return false when expiresAt is in the future', () => {
      const futureDate = new Date(now.getTime() + 1000)
      const session = new UserSessionTestBuilder().withExpiresAt(futureDate).build()

      expect(session.isExpired(now)).toBe(false)
    })
  })
})
