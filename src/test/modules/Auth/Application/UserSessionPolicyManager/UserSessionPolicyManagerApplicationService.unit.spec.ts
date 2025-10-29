/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'

describe('UserSessionPolicyManagerApplicationService', () => {
  const now = new Date('2025-10-21T12:00:00Z')
  const userId = UserIdMother.valid()

  const mockedMaxSessionRepository = mock<MaxSessionsPolicy>()
  const mockedLoggerService = mock<LoggerServiceInterface>()

  const activeSession1 = mock<UserSession>({ id: UserSessionIdMother.valid() })
  const activeSession2 = mock<UserSession>({
    id: UserSessionIdMother.valid(),
    userId: userId,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 3600),
  })

  const buildService = () => {
    return new UserSessionPolicyManagerApplicationService(mockedMaxSessionRepository, mockedLoggerService)
  }

  const assertLoggerErrorCall = (message: string, userSession: UserSession, error: unknown, stack?: string) => {
    expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.error).toHaveBeenCalledWith(message, stack, {
      sessionId: userSession.id.toString(),
      userId: userSession.userId.toString(),
      revokedAt: userSession.revokedAt,
      expiresAt: userSession.expiresAt,
      error,
    })
  }

  const assertLoggerWarnCall = (message: string, userSession: UserSession, error: string) => {
    expect(mockedLoggerService.warn).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.warn).toHaveBeenCalledWith(message, {
      sessionId: userSession.id.toString(),
      userId: userSession.userId.toString(),
      revokedAt: userSession.revokedAt,
      expiresAt: userSession.expiresAt,
      error,
    })
  }

  const assertCommonCalls = () => {
    expect(mockedMaxSessionRepository.sessionsToRevoke).toHaveBeenCalledTimes(1)
    expect(activeSession1.revoke).not.toHaveBeenCalled()

    expect(mockedMaxSessionRepository.sessionsToRevoke).toHaveBeenCalledWith([activeSession1, activeSession2])
  }

  beforeEach(() => {
    mockReset(mockedMaxSessionRepository)
    mockReset(mockedLoggerService)
    mockReset(activeSession1)
    mockReset(activeSession2)
  })

  describe('handleLogin', () => {
    const activeSessions = [activeSession1, activeSession2]

    beforeEach(() => {
      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([])
    })

    describe('happy path', () => {
      it('should call services and entities correctly when at least 1 session must to be revoked', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const service = buildService()

        service.applyPolicyAndRevokeForLogin(activeSessions, now)

        assertCommonCalls()
        expect(activeSession2.revoke).toHaveBeenCalledTimes(1)
        expect(activeSession2.revoke).toHaveBeenCalledWith(now)
      })

      it('should call services and entities correctly when any session must to be revoked', () => {
        const service = buildService()

        service.applyPolicyAndRevokeForLogin(activeSessions, now)

        assertCommonCalls()
        expect(activeSession2.revoke).not.toHaveBeenCalled()
      })

      it('should return the correct result when when at least 1 session must to be revoked', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const service = buildService()

        const result = service.applyPolicyAndRevokeForLogin(activeSessions, now)

        expect(result).toEqual({
          success: true,
          value: [activeSession2],
        })
      })

      it('should return the correct result when when any session must to be revoked', () => {
        const service = buildService()

        const result = service.applyPolicyAndRevokeForLogin(activeSessions, now)

        expect(result).toEqual({
          success: true,
          value: [],
        })
      })
    })

    describe('when there are errors', () => {
      it('should return error when revocation fails because of session is already revoked or expired', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const expectedDomainException = UserSessionDomainException.sessionAlreadyRevoked(activeSession2.id.toString())
        activeSession2.revoke.mockImplementation(() => {
          throw expectedDomainException
        })

        const service = buildService()

        const result = service.applyPolicyAndRevokeForLogin(activeSessions, now)

        expect(result).toEqual({
          success: false,
          error: UserSessionPolicyManagerApplicationError.revocationFailed(expectedDomainException.message),
        })

        assertLoggerWarnCall('Cannot revoke session', activeSession2, expectedDomainException.message)
      })

      it('should return error when revocation fails because of an unexpected error', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const unexpectedException = Error('Unexpected error')

        activeSession2.revoke.mockImplementation(() => {
          throw unexpectedException
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForLogin(activeSessions, now)).toThrow(
          `Unexpected error while revoking session ${activeSession2.id.toString()}`,
        )

        assertLoggerErrorCall('Unexpected error while revoking session', activeSession2, unexpectedException, unexpectedException.stack)
      })

      it('should return error when revocation fails because of an unexpected non-error', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const unexpectedException = 'Unexpected error'

        activeSession2.revoke.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw unexpectedException
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForLogin(activeSessions, now)).toThrow(
          `Unexpected error while revoking session ${activeSession2.id.toString()}`,
        )

        assertLoggerErrorCall('Unexpected error while revoking session', activeSession2, unexpectedException, undefined)
      })
    })
  })

  describe('handleRefreshSession', () => {
    const currentSessionId = UserSessionIdMother.valid()
    const validDeviceLocation = DeviceLocationMother.valid()
    const validUserAgent = UserAgentMother.valid()
    const validIpHash = UserSessionIpHashMother.valid()

    const currentSession = mock<UserSession>({
      id: currentSessionId,
      userId,
      ipHash: validIpHash,
      userAgent: validUserAgent,
      deviceLocation: validDeviceLocation,
      revokedAt: null,
      expiresAt: new Date(now.getTime() + 3600),
    })

    const activeSessions = [currentSession, activeSession1, activeSession2]

    beforeEach(() => {
      mockReset(currentSession)

      mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([])
    })

    describe('happy path', () => {
      it('should call services and entities correctly when at least 1 session must to be revoked', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const service = buildService()

        service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        assertCommonCalls()
        expect(currentSession.revoke).toHaveBeenCalledTimes(1)
        expect(activeSession2.revoke).toHaveBeenCalledTimes(1)
        expect(currentSession.revoke).toHaveBeenCalledWith(now)
        expect(activeSession2.revoke).toHaveBeenCalledWith(now)
      })

      it('should call services and entities correctly when any session must to be revoked', () => {
        const service = buildService()

        service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        assertCommonCalls()
        expect(activeSession2.revoke).not.toHaveBeenCalled()
        expect(activeSession1.revoke).not.toHaveBeenCalled()
        expect(currentSession.revoke).toHaveBeenCalledWith(now)
      })

      it('should the correct result when only currentSession must to be revoked', () => {
        const service = buildService()

        const result = service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        expect(result).toEqual({
          success: true,
          value: [currentSession],
        })
      })

      it('should the correct result when at least 1 session, besides currentSession, must to be revoked', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])

        const service = buildService()

        const result = service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        expect(result).toEqual({
          success: true,
          value: [currentSession, activeSession2],
        })
      })
    })

    describe('when there are errors', () => {
      it('should return error if session inconsistency is detected', () => {
        const service = buildService()

        const activeSessionsWithoutCurrent = [activeSession1, activeSession2]

        const result = service.applyPolicyAndRevokeForRefresh(currentSession, activeSessionsWithoutCurrent, now)

        expect(result.success).toBe(false)
        expect(result).toEqual({
          success: false,
          error: UserSessionPolicyManagerApplicationError.sessionsInconsistency(currentSession.id.toString(), userId.toString()),
        })

        expect(mockedLoggerService.error).toHaveBeenCalledTimes(1)
        expect(mockedLoggerService.error).toHaveBeenCalledWith(
          'Session refresh logic inconsistency. Current session not found in active sessions list',
          undefined,
          { sessionId: currentSession.id.toString(), userId: currentSession.userId.toString() },
        )
      })

      it('should return error if current session cannot be revoked', () => {
        const expectedDomainException = UserSessionDomainException.sessionAlreadyRevoked(currentSession.id.toString())

        currentSession.revoke.mockImplementation(() => {
          throw expectedDomainException
        })

        const service = buildService()

        const result = service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        expect(result.success).toBe(false)
        expect(result).toEqual({
          success: false,
          error: UserSessionPolicyManagerApplicationError.revocationFailed(expectedDomainException.message),
        })

        assertLoggerWarnCall('Cannot revoke session', currentSession, expectedDomainException.message)
      })

      it('should throw if current session cannot be revoked (Unexpected Error)', () => {
        const unexpectedError = new Error('Unexpected error')

        currentSession.revoke.mockImplementation(() => {
          throw unexpectedError
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)).toThrow(
          Error(`Unexpected error while revoking session ${currentSession.id.toString()}`),
        )

        assertLoggerErrorCall('Unexpected error while revoking session', currentSession, unexpectedError, unexpectedError.stack)
      })

      it('should throw if current session cannot be revoked (no error)', () => {
        const unexpectedError = 'Unexpected error'

        currentSession.revoke.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw unexpectedError
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)).toThrow(
          Error(`Unexpected error while revoking session ${currentSession.id.toString()}`),
        )

        assertLoggerErrorCall('Unexpected error while revoking session', currentSession, unexpectedError, undefined)
      })

      it('should return error if session to revoke cannot be revoked', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])
        const expectedDomainException = UserSessionDomainException.sessionAlreadyRevoked(currentSession.id.toString())

        activeSession2.revoke.mockImplementation(() => {
          throw expectedDomainException
        })

        const service = buildService()

        const result = service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

        expect(result.success).toBe(false)
        expect(result).toEqual({
          success: false,
          error: UserSessionPolicyManagerApplicationError.revocationFailed(expectedDomainException.message),
        })

        assertLoggerWarnCall('Cannot revoke session', activeSession2, expectedDomainException.message)
      })

      it('should throw if session to revoke cannot be revoked (Unexpected Error)', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])
        const unexpectedError = new Error('Unexpected error')

        activeSession2.revoke.mockImplementation(() => {
          throw unexpectedError
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)).toThrow(
          Error(`Unexpected error while revoking session ${activeSession2.id.toString()}`),
        )

        assertLoggerErrorCall('Unexpected error while revoking session', activeSession2, unexpectedError, unexpectedError.stack)
      })

      it('should throw if session to revoke cannot be revoked (no error)', () => {
        mockedMaxSessionRepository.sessionsToRevoke.mockReturnValue([activeSession2])
        const unexpectedError = 'Unexpected error'

        activeSession2.revoke.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw unexpectedError
        })

        const service = buildService()

        expect(() => service.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)).toThrow(
          Error(`Unexpected error while revoking session ${activeSession2.id.toString()}`),
        )

        assertLoggerErrorCall('Unexpected error while revoking session', activeSession2, unexpectedError, undefined)
      })
    })
  })
})
