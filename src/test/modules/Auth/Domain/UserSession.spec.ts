import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'

describe('create', () => {
  const now = new Date('2025-01-02T03:04:05.000Z')
  const expiresAt = new Date('2025-02-02T03:04:05.000Z')

  let id: UserSessionId
  let userId: UserId
  let tokenHash: UserSessionHash
  let userAgent: UserAgent = UserAgentMother.valid()

  beforeEach(() => {
    id = UserSessionIdMother.valid()
    userId = UserIdMother.valid()
    tokenHash = UserSessionHashMother.valid()
    userAgent = UserAgentMother.valid()
  })

  it('should initialize the User instance correctly', () => {
    const userSessionIpHash: UserSessionIpHash = UserSessionIpHashMother.valid()
    const deviceCountry = 'ES'
    const deviceCity = 'Madrid'
    const deviceTimezone = 'Europe/Madrid'

    const session = UserSession.create(id, userId, tokenHash, userAgent, expiresAt, now, {
      ipHash: userSessionIpHash,
      deviceCountry,
      deviceCity,
      deviceTimezone,
    })

    expect(session.id.equals(id)).toBe(true)
    expect(session.userId.equals(userId)).toBe(true)
    expect(session.tokenHash.equals(tokenHash)).toBe(true)
    expect(session.expiresAt.getTime()).toBe(expiresAt.getTime())
    expect(session.revokedAt).toBeNull()
    expect(session.ipHash?.equals(userSessionIpHash)).toBe(true)
    expect(session.userAgent?.equals(userAgent)).toBe(true)
    expect(session.deviceCountry).toBe(deviceCountry)
    expect(session.deviceCity).toBe(deviceCity)
    expect(session.deviceTimezone).toBe(deviceTimezone)
    expect(session.createdAt.getTime()).toBe(now.getTime())
    expect(session.updatedAt.getTime()).toBe(now.getTime())
  })

  it('should set to NULL when optional params are not given', () => {
    const session = UserSession.create(id, userId, tokenHash, userAgent, expiresAt, now, {})

    expect(session.ipHash).toBeNull()
    expect(session.deviceCountry).toBeNull()
    expect(session.deviceCity).toBeNull()
    expect(session.deviceTimezone).toBeNull()
  })
})
