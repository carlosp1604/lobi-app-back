/* eslint @typescript-eslint/unbound-method: 0 */
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { mock, mockReset } from 'jest-mock-extended'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
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

describe('RefreshToken', () => {
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedGenerateTokensService = mock<GenerateTokensApplicationService>()
  const mockedUserSessionPolicyManagerService = mock<UserSessionPolicyManagerApplicationService>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedClockService = mock<ClockServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const now = new Date('2025-10-21T10:00:00Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const hashedToken = 'hashed-token'
  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)
  const validDeviceLocation = DeviceLocationMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  let request: RefreshSessionApplicationRequestDto

  const userId = UserIdMother.valid()
  const newUserSessionId = UserSessionIdMother.valid()
  const currentUserSessionId = UserSessionIdMother.valid()

  const currentSession = mock<UserSession>({
    id: currentUserSessionId,
    userId,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 3600),
  })

  const expectedRequestOriginData: RequestOriginData = {
    userAgent: validUserAgent,
    ipHash: validIpHash.toString(),
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
      mockedUnitOfWork,
      mockedUserRepository,
      mockedSessionRepository,
      mockedGenerateTokensService,
      mockedUserSessionPolicyManagerService,
      mockedRequestOriginService,
      mockedHasherService,
      mockedClockService,
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
      userAgent: validUserAgent.toString(),
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

    expect(mockedRequestOriginService.process).toHaveBeenCalledWith(request.ip, request.userAgent)
    expect(mockedHasherService.hash).toHaveBeenCalledWith(request.token)
    expect(mockedSessionRepository.findByHash).toHaveBeenCalledWith(hashedToken, fakeContext)
    expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledWith(currentSession.userId.toString(), fakeContext)
    expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(
      user.id,
      now,
      expectedRequestOriginData.userAgent,
      validIpHash,
      expectedRequestOriginData.deviceLocation,
    )
    expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledWith(userId.toString(), now, fakeContext)
    expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh).toHaveBeenCalledWith(
      currentSession,
      activeSessions,
      now,
    )
    expect(mockedSessionRepository.save).toHaveBeenCalledWith(sessionsToPersist, fakeContext)
  }

  describe('happy path', () => {
    it('should call services and entities correctly when current session must to be revoked', async () => {
      const useCase = buildUseCase()

      await useCase.execute(request)

      checkCommonCalls([currentSession], [currentSession, newSession])
    })

    it('should call services and entities correctly when current session must to be revoked', async () => {
      const activeSessions = [currentSession, activeSession2, activeSession3]

      mockedSessionRepository.findUserActiveSessions.mockResolvedValue(activeSessions)
      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: true,
        value: [currentSession, activeSession2],
      })

      const useCase = buildUseCase()

      await useCase.execute(request)

      checkCommonCalls(activeSessions, [currentSession, activeSession2, newSession])
    })

    it('return the correct result', async () => {
      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      expect(result).toEqual({
        success: true,
        value: {
          sessionId: newSession.id.toString(),
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

        expect(result).toEqual({
          success: false,
          error: RefreshSessionApplicationError.invalidTokenFormat(),
        })

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
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

      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.sessionNotFound(),
      })
      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    it('should return error when the session to refresh is already revoked', async () => {
      currentSession.isExpired.mockReturnValue(false)
      currentSession.isRevoked.mockReturnValue(true)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.sessionAlreadyRevoked(currentSession.id.toString()),
      })
      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    it('should return error when the session to refresh is already expired', async () => {
      currentSession.isRevoked.mockReturnValue(false)
      currentSession.isExpired.mockReturnValue(true)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.sessionAlreadyExpired(currentSession.id.toString()),
      })
      expect(mockedUserRepository.findByIdWithLock).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toEqual({
          success: false,
          error: RefreshSessionApplicationError.userNotFound(userId.toString()),
        })
      }

      it('should return error when user does not exist', async () => {
        mockedUserRepository.findByIdWithLock.mockResolvedValue(null)

        await runTestCaseAndAssertResult()
      })

      it('should return error when user is not active', async () => {
        const inactiveUser = new UserTestBuilder().withId(userId).withStatus(UserStatus.deactivated()).withDeletedAt(null).build()
        mockedUserRepository.findByIdWithLock.mockResolvedValue(inactiveUser)

        await runTestCaseAndAssertResult()
      })

      it('should return error if user is deleted', async () => {
        const inactiveUser = new UserTestBuilder().withId(userId).withStatus(UserStatus.active()).withDeletedAt(now).build()
        mockedUserRepository.findByIdWithLock.mockResolvedValue(inactiveUser)

        await runTestCaseAndAssertResult()
      })
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns sessionsInconsistency error', async () => {
      const serviceError = UserSessionPolicyManagerApplicationError.sessionsInconsistency(
        currentSession.id.toString(),
        userId.toString(),
      )

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: serviceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.sessionInconsistency(serviceError.message),
      })
      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns revocationFailed error', async () => {
      const serviceError = UserSessionPolicyManagerApplicationError.revocationFailed(currentSession.id.toString())

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: serviceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.revocationFailed(serviceError.message),
      })
      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when UserSessionPolicyManagerApplicationService returns an unknown error', async () => {
      const unknownServiceError: UserSessionPolicyManagerApplicationError = {
        message: 'Unexpected error',
        id: 'unexpected-error',
        name: UserSessionPolicyManagerApplicationError.name,
      }

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForRefresh.mockReturnValue({
        success: false,
        error: unknownServiceError,
      })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result).toEqual({
        success: false,
        error: RefreshSessionApplicationError.internalError(`Unknown internal error: ${unknownServiceError.message}`),
      })
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
