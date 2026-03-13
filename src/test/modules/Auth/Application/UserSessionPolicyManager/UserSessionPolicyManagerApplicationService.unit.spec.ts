/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'

describe('UserSessionPolicyManagerApplicationService', () => {
  const now = new Date('2025-10-21T12:00:00Z')
  const futureDate = new Date(now.getTime() + 3600000)
  const pastDate = new Date(now.getTime() - 3600000)
  const userId = IdentifierMother.valid()

  const mockedMaxSessionRepository = mock<MaxSessionsPolicy>()
  const mockedLoggerService = mock<LoggerServiceInterface>()

  let activeSession1: UserSession
  let activeSession2: UserSession
  let currentSession: UserSession

  const buildService = () => {
    return new UserSessionPolicyManagerApplicationService(mockedMaxSessionRepository, mockedLoggerService)
  }

  const assertLoggerWarnCall = (message: string, userSession: UserSession, error: string) => {
    expect(mockedLoggerService.warn).toHaveBeenCalledWith(message, {
      sessionId: userSession.id.value,
      userId: userSession.userId.value,
      revokedAt: userSession.revokedAt,
      expiresAt: userSession.expiresAt,
      error,
    })
  }

  beforeEach(() => {
    mockReset(mockedLoggerService)
    mockReset(mockedMaxSessionRepository)

    activeSession1 = new UserSessionTestBuilder().withUserId(userId).withExpiresAt(futureDate).build()
    activeSession2 = new UserSessionTestBuilder().withUserId(userId).withExpiresAt(futureDate).build()
    currentSession = new UserSessionTestBuilder().withUserId(userId).withExpiresAt(futureDate).build()
  })

  describe('handleLogin', () => {
    it('should revoke sessions according to policy and verify state', () => {
      const activeSessions = [activeSession1, activeSession2]
      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

      const service = buildService()
      const result = service.applyPolicyAndRevokeForLogin(activeSessions, now)

      expect(result.success).toBe(true)
      expect(activeSession2.revokedAt).toEqual(now)
      expect(activeSession1.revokedAt).toBeNull()
    })

    it('should log and return error when revocation fails', () => {
      const expiredSession = new UserSessionTestBuilder().withExpiresAt(pastDate).build()
      const activeSessions = [expiredSession]

      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([expiredSession])

      const service = buildService()

      const result = service.applyPolicyAndRevokeForLogin(activeSessions, now)

      const expectedDomainException = UserSessionDomainException.sessionAlreadyExpired(expiredSession.id.value)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(UserSessionPolicyManagerApplicationError.revocationFailed(expectedDomainException.message))

      expect(expiredSession.revokedAt).toBeNull()

      assertLoggerWarnCall('Session revocation failed', expiredSession, expectedDomainException.message)
    })
  })

  describe('handleRefreshSession', () => {
    it('should revoke both current and policy-selected sessions', () => {
      const activeSessions = [currentSession, activeSession1, activeSession2]
      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

      const service = buildService()
      const result = service.applyPolicyAndRevokeForRefresh(currentSession.id, userId, activeSessions, now)

      expect(result.success).toBe(true)
      expect(currentSession.revokedAt).toEqual(now)
      expect(activeSession2.revokedAt).toEqual(now)
      expect(activeSession1.revokedAt).toBeNull()
    })

    it('should log and return error when current session is not in active list', () => {
      const activeSessionsWithoutCurrent = [activeSession1]
      const service = buildService()

      const result = service.applyPolicyAndRevokeForRefresh(currentSession.id, userId, activeSessionsWithoutCurrent, now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        UserSessionPolicyManagerApplicationError.sessionsInconsistency(currentSession.id.value, currentSession.userId.value),
      )

      expect(mockedLoggerService.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
        sessionId: currentSession.id.value,
        userId: currentSession.userId.value,
        reason: 'Current session not found in active sessions list',
      })
    })

    it('should log and return error when currentSession revocation fails', () => {
      const expiredSession = new UserSessionTestBuilder().withExpiresAt(pastDate).build()
      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([expiredSession])

      const expectedDomainException = UserSessionDomainException.sessionAlreadyExpired(expiredSession.id.value)

      const service = buildService()
      const result = service.applyPolicyAndRevokeForRefresh(expiredSession.id, userId, [expiredSession], now)

      expect(result.success).toBe(false)
      assertLoggerWarnCall('Session revocation failed', expiredSession, expectedDomainException.message)
    })

    it('should log and return error when current session is revoked but a policy-selected session fails', () => {
      const expiredSession = new UserSessionTestBuilder().withExpiresAt(pastDate).build()
      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([expiredSession])

      const expectedDomainException = UserSessionDomainException.sessionAlreadyExpired(expiredSession.id.value)

      const service = buildService()
      const result = service.applyPolicyAndRevokeForRefresh(activeSession1.id, userId, [activeSession1, expiredSession], now)

      expect(result.success).toBe(false)
      assertLoggerWarnCall('Session revocation failed', expiredSession, expectedDomainException.message)
    })
  })
})
