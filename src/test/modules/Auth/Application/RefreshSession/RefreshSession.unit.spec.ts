/* eslint @typescript-eslint/unbound-method: 0 */
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { mock, mockReset } from 'jest-mock-extended'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'

describe('RefreshToken', () => {
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedGenerateTokensService = mock<GenerateTokensApplicationService>()
  const mockedUserSessionPolicyManagerService = mock<UserSessionPolicyManagerApplicationService>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedClockService = mock<ClockServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()
  const mockedLoggerService = mock<LoggerServiceInterface>()

  const now = new Date('2025-10-21T10:00:00Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const hashedToken = UserSessionTokenHashMother.valid().value
  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)
  const validDeviceLocation = DeviceLocationMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  let request: RefreshSessionApplicationRequestDto

  const userId = IdentifierMother.valid()
  const newUserSessionId = IdentifierMother.valid()
  const currentUserSessionId = IdentifierMother.valid()

  const currentSession = mock<UserSession>({
    id: currentUserSessionId,
    userId,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 3600),
  })

  const expectedRequestOriginData: RequestOriginData = {
    userAgent: validUserAgent,
    ipHash: validIpHash.value,
    normalizedIp: 'normalized-ip',
    deviceLocation: validDeviceLocation,
  }

  const activeSession2 = mock<UserSession>()
  const activeSession3 = mock<UserSession>()

  const newSession = mock<UserSession>({ id: newUserSessionId, userId })

  const user = new UserTestBuilder().withId(userId).withStatus(UserStatus.active()).withDeletedAt(null).build()

  const generatedTokens = {
    session: newSession,
    refreshToken: 'refresh-clear-token',
    accessToken: 'access-jwt-token',
    accessTokenExpiresAt: expectedAccessExpiresAt,
    refreshTokenExpiresAt: expectedRefreshExpiresAt,
  }

  const buildUseCase = () => {
    return new RefreshSession(
      mockedUserRepository,
      mockedSessionRepository,
      mockedHasherService,
      mockedGenerateTokensService,
      mockedUserSessionPolicyManagerService,
      mockedRequestOriginService,
      mockedClockService,
      mockedUnitOfWork,
      mockedLoggerService,
    )
  }

  beforeEach(() => {
    mockReset(mockedUnitOfWork)
    mockReset(mockedUserRepository)
    mockReset(mockedSessionRepository)
    mockReset(mockedGenerateTokensService)
    mockReset(mockedHasherService)
    mockReset(mockedClockService)
    mockReset(currentSession)
    mockReset(mockedUserSessionPolicyManagerService)
    mockReset(mockedRequestOriginService)
    mockReset(mockedLoggerService)

    mockedClockService.now.mockReturnValue(now)
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })
    mockedSessionRepository.findUserActiveSessions.mockResolvedValue([currentSession])
    mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({ success: true, value: [currentSession] })
    mockedRequestOriginService.process.mockResolvedValue(expectedRequestOriginData)

    mockedHasherService.hash.mockResolvedValue(hashedToken)
    mockedSessionRepository.findByHash.mockResolvedValue(currentSession)
    mockedUserRepository.findByIdWithLock.mockResolvedValue(user)
    mockedGenerateTokensService.generate.mockResolvedValue(generatedTokens)

    currentSession.isExpired.mockReturnValue(false)
    currentSession.isRevoked.mockReturnValue(false)

    request = {
      token: 'a'.repeat(48),
      ip: '203.0.113.10',
      userAgent: validUserAgent.raw,
    }
  })

  const checkCommonCalls = (activeSessions: Array<UserSession>, sessionsToPersist: Array<UserSession>) => {
    expect(mockedRequestOriginService.process).toHaveBeenCalledTimes(1)
    expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
    expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
    expect(mockedSessionRepository.findByHash).toHaveBeenCalledTimes(1)
    expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledTimes(1)
    expect(mockedGenerateTokensService.generate).toHaveBeenCalledTimes(1)
    expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
    expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh).toHaveBeenCalledTimes(1)
    expect(mockedSessionRepository.save).toHaveBeenCalledTimes(1)
    expect(mockedLoggerService.warn).not.toHaveBeenCalled()

    expect(mockedRequestOriginService.process).toHaveBeenCalledWith(request.ip, request.userAgent)
    expect(mockedHasherService.hash).toHaveBeenCalledWith(request.token)
    expect(mockedSessionRepository.findByHash).toHaveBeenCalledWith(hashedToken, fakeContext)
    expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledWith(currentSession.userId.value, fakeContext)
    expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(
      user.id,
      now,
      expectedRequestOriginData.userAgent,
      validIpHash,
      expectedRequestOriginData.deviceLocation,
    )
    expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledWith(userId, now, fakeContext)
    expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh).toHaveBeenCalledWith(
      currentSession.id,
      userId,
      activeSessions,
      now,
    )
    expect(mockedSessionRepository.save).toHaveBeenCalledWith(sessionsToPersist, fakeContext)
  }

  describe('happy path', () => {
    it('should call services and entities correctly and return the correct result when only the current session must be revoked', async () => {
      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      checkCommonCalls([currentSession], [currentSession, newSession])

      expect(result).toEqual({
        success: true,
        value: {
          sessionId: newSession.id.value,
          refreshToken: 'refresh-clear-token',
          accessToken: 'access-jwt-token',
          accessTokenExpiresAt: expectedAccessExpiresAt,
          refreshTokenExpiresAt: expectedRefreshExpiresAt,
        },
      })
    })

    it('should call services and entities correctly and return the correct result when policy requires revoking additional active sessions alongside the current one', async () => {
      const activeSessions = [currentSession, activeSession2, activeSession3]

      mockedSessionRepository.findUserActiveSessions.mockResolvedValue(activeSessions)
      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: true,
        value: [currentSession, activeSession2],
      })

      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      checkCommonCalls(activeSessions, [currentSession, activeSession2, newSession])

      expect(result).toEqual({
        success: true,
        value: {
          sessionId: newSession.id.value,
          refreshToken: 'refresh-clear-token',
          accessToken: 'access-jwt-token',
          accessTokenExpiresAt: expectedAccessExpiresAt,
          refreshTokenExpiresAt: expectedRefreshExpiresAt,
        },
      })
    })
  })

  describe('when there are errors', () => {
    describe('when token is not valid', () => {
      const testCase = async (request: RefreshSessionApplicationRequestDto) => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(RefreshSessionApplicationError.invalidTokenFormat())

        expect(mockedRequestOriginService.process).not.toHaveBeenCalled()
      }

      it('should return error when token is not valid due to insufficient length', async () => {
        const requestWithInsufficientLengthToken = { ...request, token: 'invalid-token' }

        await testCase(requestWithInsufficientLengthToken)
      })

      it('should return error when token is not valid due to excessive length', async () => {
        const requestWithExcessiveLengthToken = { ...request, token: 'a'.repeat(120) }

        await testCase(requestWithExcessiveLengthToken)
      })

      it('should return error when token format is not valid', async () => {
        const requestWithExcessiveLengthToken = { ...request, token: '*'.repeat(48) }

        await testCase(requestWithExcessiveLengthToken)
      })
    })

    it('should return error when the session to refresh does not exist', async () => {
      mockedSessionRepository.findByHash.mockResolvedValue(null)

      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionNotFound())

      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    it('should return error when the session to refresh is already revoked', async () => {
      currentSession.isExpired.mockReturnValue(false)
      currentSession.isRevoked.mockReturnValue(true)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyRevoked(currentSession.id.value))

      expect(mockedLoggerService.warn).toHaveBeenCalledWith('Session refresh rejected', {
        sessionId: currentSession.id.value,
        userId: userId.value,
        reason: 'Session has been revoked',
      })
      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    it('should return error when the session to refresh is already expired', async () => {
      currentSession.isRevoked.mockReturnValue(false)
      currentSession.isExpired.mockReturnValue(true)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyExpired(currentSession.id.value))

      expect(mockedLoggerService.warn).toHaveBeenCalledWith('Session refresh rejected', {
        sessionId: currentSession.id.value,
        userId: userId.value,
        reason: 'Session has expired',
      })
      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async (reason: string) => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(RefreshSessionApplicationError.userNotFound(userId.value))

        expect(mockedLoggerService.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
          userId: userId.value,
          sessionId: currentSession.id.value,
          reason,
        })
      }

      it('should return error when user does not exist', async () => {
        mockedUserRepository.findByIdWithLock.mockResolvedValue(null)

        await runTestCaseAndAssertResult('User not found')
      })

      it('should return error when user is not active', async () => {
        const inactiveUser = new UserTestBuilder().withId(userId).withStatus(UserStatus.deactivated()).withDeletedAt(null).build()
        mockedUserRepository.findByIdWithLock.mockResolvedValue(inactiveUser)

        await runTestCaseAndAssertResult('User is disabled')
      })

      it('should return error if user is deleted', async () => {
        const inactiveUser = new UserTestBuilder().withId(userId).withStatus(UserStatus.active()).withDeletedAt(now).build()
        mockedUserRepository.findByIdWithLock.mockResolvedValue(inactiveUser)

        await runTestCaseAndAssertResult('User is disabled')
      })
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns sessionsInconsistency error', async () => {
      const serviceError = UserSessionPolicyManagerApplicationError.sessionsInconsistency(currentSession.id.value, userId.value)

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: serviceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionInconsistency(serviceError.message))

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns revocationFailed error', async () => {
      const serviceError = UserSessionPolicyManagerApplicationError.revocationFailed(currentSession.id.value)

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: serviceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.revocationFailed(serviceError.message))

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns an unknown error', async () => {
      const unknownServiceError = {
        message: 'Unknown error',
        id: 'user_session_policy_manager_application_service_unknown_error',
      } as unknown as UserSessionPolicyManagerApplicationError

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: unknownServiceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        RefreshSessionApplicationError.internalError(`Unknown internal error: ${unknownServiceError.message}`),
      )

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error when RequestOriginApplicationService fails', async () => {
      mockedRequestOriginService.process.mockImplementation(() => {
        throw Error('Unexpected error')
      })

      const useCase = buildUseCase()
      await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should throw error when UserSessionPolicyManagerApplicationService fails', async () => {
      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockImplementation(() => {
        throw Error('Unexpected error')
      })

      const useCase = buildUseCase()
      await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error when UserRepository fails', async () => {
      mockedUserRepository.findByIdWithLock.mockImplementation(() => {
        throw Error('Unexpected error')
      })

      const useCase = buildUseCase()
      await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
      expect(mockedGenerateTokensService.generate).not.toHaveBeenCalled()
    })

    it('should throw error when UserSessionRepository fails', async () => {
      mockedSessionRepository.findUserActiveSessions.mockImplementation(() => {
        throw Error('Unexpected error')
      })

      const useCase = buildUseCase()
      await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })
  })
})
