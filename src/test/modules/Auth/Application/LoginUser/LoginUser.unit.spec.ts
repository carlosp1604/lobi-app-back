/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'

describe('LoginUser', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialsRepository = mock<UserCredentialRepositoryInterface>()
  const mockedSessionsRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedGenerateTokensService = mock<GenerateTokensApplicationService>()
  const mockedUserSessionPolicyManagerService = mock<UserSessionPolicyManagerApplicationService>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()
  const mockedDomainEventFactory = mock<AuthDomainEventFactory>()

  const now = new Date('2025-01-02T03:04:05.000Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)

  const validEmail = EmailAddressMother.valid()
  const validUserId = IdentifierMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  const expectedSessionId = IdentifierMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  let successfulLoginEvent: DomainEvent
  let failedLoginAttemptEvent: DomainEvent

  let expectedRequestOriginData: RequestOriginData
  let request: LoginUserApplicationRequestDto

  const mockedCredential = mock<UserCredential>({ passwordHash: validPasswordHash })

  const user = new UserTestBuilder()
    .withId(validUserId)
    .withEmail(validEmail)
    .withStatus(UserStatus.active())
    .withDeletedAt(null)
    .build()

  let userSessionTestBuilder: UserSessionTestBuilder

  const activeSession1 = mock<UserSession>({ id: IdentifierMother.valid() })
  const activeSession2 = mock<UserSession>()
  const activeSession3 = mock<UserSession>()

  const buildGenerateTokensResponse = (session: UserSession) => {
    return {
      session,
      refreshToken: 'refresh-clear-token',
      accessToken: 'access-jwt-token',
      refreshTokenExpiresAt: expectedRefreshExpiresAt,
      accessTokenExpiresAt: expectedAccessExpiresAt,
    }
  }

  const buildUseCase = () => {
    return new LoginUser(
      mockedUserRepository,
      mockedCredentialsRepository,
      mockedSessionsRepository,
      mockedDomainEventRepository,
      mockedHasherService,
      mockedGenerateTokensService,
      mockedUserSessionPolicyManagerService,
      mockedRequestOriginService,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedDomainEventFactory,
    )
  }

  beforeEach(() => {
    mockReset(mockedUserRepository)
    mockReset(mockedCredentialsRepository)
    mockReset(mockedSessionsRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedHasherService)
    mockReset(mockedGenerateTokensService)
    mockReset(mockedUserSessionPolicyManagerService)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedLogger)
    mockReset(mockedRequestOriginService)
    mockReset(mockedDomainEventFactory)
    mockReset(activeSession3)
    mockReset(activeSession2)
    mockReset(activeSession1)

    userSessionTestBuilder = new UserSessionTestBuilder()
      .withIpHash(validIpHash)
      .withUserAgent(validUA)
      .withUserId(validUserId)
      .withId(expectedSessionId)
      .withDeviceLocation(validDeviceLocation)

    expectedRequestOriginData = {
      userAgent: validUA,
      ipHash: validIpHash.value,
      normalizedIp: 'normalized-ip',
      deviceLocation: validDeviceLocation,
    }

    const expectedSession = userSessionTestBuilder.build()

    mockedClock.now.mockReturnValue(now)
    mockedUserRepository.findByEmailWithLock.mockResolvedValue(user)
    mockedCredentialsRepository.findByUserId.mockResolvedValue(mockedCredential)
    mockedHasherService.compare.mockResolvedValue(true)
    mockedGenerateTokensService.generate.mockResolvedValue(buildGenerateTokensResponse(expectedSession))
    mockedSessionsRepository.findUserActiveSessions.mockResolvedValue([activeSession1, activeSession2, activeSession3])
    mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [] })
    mockedRequestOriginService.process.mockResolvedValue(expectedRequestOriginData)
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    successfulLoginEvent = new DomainEventTestBuilder().build()
    failedLoginAttemptEvent = new DomainEventTestBuilder().build()

    mockedDomainEventFactory.createSuccessfulLoginEvent.mockReturnValue(successfulLoginEvent)
    mockedDomainEventFactory.createFailedAttemptEvent.mockReturnValue(failedLoginAttemptEvent)

    activeSession1.isSameDeviceAs.mockReturnValue(false)
    activeSession2.isSameDeviceAs.mockReturnValue(false)
    activeSession3.isSameDeviceAs.mockReturnValue(false)

    request = {
      email: validEmail.value,
      password: UserPasswordMother.random().value,
      ip: '8.8.8.8',
      userAgent: validUA.value,
    }
  })

  describe('happy path', () => {
    const checkCommonCalls = (
      expectedSession: UserSession,
      expectNewDevice: boolean,
      ipHash: UserSessionIpHash | null,
      deviceLocation: DeviceLocation | null,
      sessionsToRevoke: Array<UserSession>,
    ) => {
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRequestOriginService.process).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.compare).toHaveBeenCalledTimes(1)
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createSuccessfulLoginEvent).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(mockedRequestOriginService.process).toHaveBeenCalledWith(request.ip, request.userAgent, { email: validEmail.value })
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith(validEmail.value, fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedHasherService.compare).toHaveBeenCalledWith(request.password, validPasswordHash.value)

      expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(validUserId, now, validUA, ipHash, deviceLocation)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId, now, fakeContext)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledWith(
        [activeSession1, activeSession2, activeSession3],
        now,
      )
      expect(mockedDomainEventFactory.createSuccessfulLoginEvent).toHaveBeenCalledWith(expectedSession, expectNewDevice, now)
      expect(mockedSessionsRepository.save).toHaveBeenCalledWith([...sessionsToRevoke, expectedSession], fakeContext)
      expect(mockedCredentialsRepository.update).toHaveBeenCalledWith(mockedCredential, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(successfulLoginEvent, fakeContext)
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledWith(now)
    }

    const checkResult = (result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>, newDevice: boolean) => {
      expect(result.success).toBe(true)
      expect(result).toEqual({
        success: true,
        value: {
          refreshToken: 'refresh-clear-token',
          accessToken: 'access-jwt-token',
          accessTokenExpiresAt: expectedAccessExpiresAt,
          sessionId: expectedSessionId.value,
          refreshTokenExpiresAt: expectedRefreshExpiresAt,
          isNewDevice: newDevice,
        },
      })
    }

    it('should call services and entities correctly and return the correct result when at least 1 session must to be revoked and is newDevice', async () => {
      const expectedSession = userSessionTestBuilder.build()
      const sessionsToRevoke = [activeSession1]
      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: sessionsToRevoke })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      checkCommonCalls(expectedSession, true, validIpHash, validDeviceLocation, sessionsToRevoke)
      checkResult(result, true)
    })

    it('should call services and entities correctly and return the correct result when any session must to be revoked and is not newDevice', async () => {
      mockedRequestOriginService.process.mockResolvedValue({
        ...expectedRequestOriginData,
        deviceLocation: null,
        ipHash: null,
      })

      const expectedSession = userSessionTestBuilder.withIpHash(null).withDeviceLocation(null).build()
      mockedGenerateTokensService.generate.mockResolvedValue(buildGenerateTokensResponse(expectedSession))

      activeSession3.isSameDeviceAs.mockReturnValue(true)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      checkCommonCalls(expectedSession, false, null, null, [])
      checkResult(result, false)
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const invalidEmail = EmailAddressMother.invalid()
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, email: invalidEmail })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidUserEmail(invalidEmail))

      expect(mockedRequestOriginService.process).not.toHaveBeenCalled()
    })

    it('should return error when password format is not valid', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, password: UserPasswordMother.invalid() })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidPasswordFormat())

      expect(mockedRequestOriginService.process).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userNotFound(validEmail.value))

        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      }

      it('should return error when user does not exist', async () => {
        mockedUserRepository.findByEmailWithLock.mockResolvedValue(null)

        await runTestCaseAndAssertResult()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login rejected', {
          email: validEmail.value,
          reason: 'User not found',
        })
        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return error when user is not active', async () => {
        const deletedUser = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.deactivated())
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(deletedUser)

        await runTestCaseAndAssertResult()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login rejected', {
          email: validEmail.value,
          reason: 'User is disabled',
        })
        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return error when user is deleted', async () => {
        const deletedUser = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.active())
          .withDeletedAt(now)
          .build()

        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(deletedUser)

        await runTestCaseAndAssertResult()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login rejected', {
          email: validEmail.value,
          reason: 'User is disabled',
        })
        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      })
    })

    it('should return error when user does not have credentials', async () => {
      mockedCredentialsRepository.findByUserId.mockResolvedValue(null)

      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.userDoesNotHaveCredentials(validUserId.value))

      expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
        userId: validUserId.value,
        email: validEmail.value,
        reason: 'Active user has no credentials',
      })

      expect(mockedHasherService.compare).not.toHaveBeenCalled()
    })

    it('should return error and create the correct domain event when password does not match', async () => {
      const useCase = buildUseCase()

      mockedHasherService.compare.mockResolvedValue(false)
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidCredentials(validUserId.value))

      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(failedLoginAttemptEvent, fakeContext)

      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createFailedAttemptEvent).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createFailedAttemptEvent).toHaveBeenCalledWith(
        validUserId,
        validDeviceLocation,
        validUA,
        validIpHash.value,
        now,
      )
      expect(mockedGenerateTokensService.generate).not.toHaveBeenCalled()
    })

    describe('when session cannot be revoked', () => {
      it('should return error if userSessionPolicyManager returns revocationFailed error', async () => {
        const expectedError = UserSessionPolicyManagerApplicationError.revocationFailed(
          `Cannot revoke session with ID ${activeSession1.id.value}`,
        )
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: false, error: expectedError })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.revocationFailed(expectedError.message))

        expect(mockedDomainEventFactory.createSuccessfulLoginEvent).not.toHaveBeenCalled()
      })

      it('should return error if UserSessionPolicyManagerApplicationService returns an unknown error', async () => {
        const unknownServiceError = {
          message: 'Unknown error',
          id: 'user_session_policy_manager_application_service_unknown_error',
        } as unknown as UserSessionPolicyManagerApplicationError

        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({
          success: false,
          error: unknownServiceError,
        })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          LoginUserApplicationError.internalError(`Unknown internal error: ${unknownServiceError.message}`),
        )

        expect(mockedDomainEventFactory.createSuccessfulLoginEvent).not.toHaveBeenCalled()
      })

      it('should throw error when RequestOriginApplicationService fails', async () => {
        mockedRequestOriginService.process.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should return error if UserSessionPolicyManagerApplicationService fails', async () => {
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
        expect(mockedDomainEventFactory.createSuccessfulLoginEvent).not.toHaveBeenCalled()
      })
    })

    it('should throw error when UserRepository fails', async () => {
      mockedUserRepository.findByEmailWithLock.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error when HasherService fails', async () => {
      mockedHasherService.compare.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
      expect(mockedGenerateTokensService.generate).not.toHaveBeenCalled()
    })

    it('should throw error when GenerateTokensApplicationService fails', async () => {
      mockedGenerateTokensService.generate.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
      expect(mockedSessionsRepository.findUserActiveSessions).not.toHaveBeenCalled()
    })
  })
})
