import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'

describe('UserSessionPolicyManagerApplicationService', () => {
  const now = new Date('2025-10-21T14:00:00Z')
  const maxSessions = env.USER_MAX_SESSIONS

  const userId = IdentifierMother.valid()

  const buildService = () => {
    return new UserSessionPolicyManagerApplicationService(new MaxSessionsPolicy(maxSessions), new LoggerServiceMock())
  }

  const buildUserSession = (createdAt: Date) => {
    return new UserSessionTestBuilder()
      .withId(IdentifierMother.valid())
      .withUserId(userId)
      .withCreatedAt(createdAt)
      .withUpdatedAt(now)
      .withRevokedAt(null)
      .withExpiresAt(new Date(now.getTime() + 3600))
      .build()
  }

  describe('applyPolicyAndRevokeForLogin', () => {
    it('should not revoke any session if under limit', () => {
      const service = buildService()

      const activeSession1 = buildUserSession(now)
      const activeSession2 = buildUserSession(now)

      const result = service.applyPolicyAndRevokeForLogin([activeSession1, activeSession2], now)

      expect(result).toEqual({
        success: true,
        value: [],
      })

      expect(activeSession1.revokedAt).toBeNull()
      expect(activeSession2.revokedAt).toBeNull()
    })

    it('should revoke the oldest session if limit is reached', () => {
      const service = buildService()

      const oldestSession = buildUserSession(new Date(now.getTime() - 3600))
      const session2 = buildUserSession(now)
      const session3 = buildUserSession(now)

      const result = service.applyPolicyAndRevokeForLogin([oldestSession, session2, session3], now)

      expect(result.success).toBe(true)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const value = result.value as Array<UserSession>
      expect(value.length).toBe(1)
      expect(value[0].id.equals(oldestSession.id)).toBe(true)
      expect(value[0].revokedAt).toBe(now)

      expect(session2.revokedAt).toBeNull()
      expect(session3.revokedAt).toBeNull()
    })
  })

  describe('handleRefreshSession', () => {
    it('should revoke only the current session', () => {
      const service = buildService()

      const currentSession = buildUserSession(now)

      const result = service.applyPolicyAndRevokeForRefresh(currentSession.id, userId, [currentSession], now)

      expect(result.success).toBe(true)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const value = result.value as Array<UserSession>
      expect(value.length).toBe(1)
      expect(value[0].id.equals(currentSession.id)).toBe(true)
      expect(value[0].revokedAt).toBe(now)
    })

    it('should revoke the current and the oldest session if limit is reached', () => {
      const service = buildService()

      const currentSession = buildUserSession(now)
      const oldestSession = buildUserSession(new Date(now.getTime() - 3000))
      const session2 = buildUserSession(new Date(now.getTime() - 2000))
      const session3 = buildUserSession(new Date(now.getTime() - 1000))

      const activeSessions = [oldestSession, session2, session3, currentSession]

      const result = service.applyPolicyAndRevokeForRefresh(currentSession.id, userId, activeSessions, now)

      expect(result.success).toBe(true)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const value = result.value as Array<UserSession>
      expect(value.length).toBe(2)
      expect(value[0].id.equals(currentSession.id)).toBe(true)
      expect(value[0].revokedAt).toBe(now)
      expect(value[1].id.equals(oldestSession.id)).toBe(true)
      expect(value[1].revokedAt).toBe(now)
    })
  })
})
