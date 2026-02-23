/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { GenerateTokensApplicationResponseDto } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationResponseDto'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'

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
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const now = new Date('2025-01-02T03:04:05.000Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)

  const validEmail = EmailAddressMother.valid()
  const validUserId = IdentifierMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  const expectedSessionId = IdentifierMother.valid()
  const expectedDomainEventId = IdentifierMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  const expectedRequestOriginData: RequestOriginData = {
    userAgent: validUA,
    ipHash: validIpHash.value,
    normalizedIp: 'normalized-ip',
    deviceLocation: validDeviceLocation,
  }

  let request: LoginUserApplicationRequestDto

  const mockedCredential = mock<UserCredential>({ passwordHash: validPasswordHash })

  const user = new UserTestBuilder()
    .withId(validUserId)
    .withEmail(validEmail)
    .withStatus(UserStatus.active())
    .withDeletedAt(null)
    .build()

  let userSessionTestBuilder = new UserSessionTestBuilder()
    .withIpHash(validIpHash)
    .withUserAgent(validUA)
    .withUserId(validUserId)
    .withId(expectedSessionId)
    .withDeviceLocation(validDeviceLocation)

  const expectedSession = userSessionTestBuilder.build()

  const activeSession1 = mock<UserSession>({ id: IdentifierMother.valid() })
  const activeSession2 = mock<UserSession>()
  const activeSession3 = mock<UserSession>()

  const expectedGenerateTokensResponse: GenerateTokensApplicationResponseDto = {
    session: userSessionTestBuilder.build(),
    refreshToken: 'refresh-clear-token',
    accessToken: 'access-jwt-token',
    refreshTokenExpiresAt: expectedRefreshExpiresAt,
    accessTokenExpiresAt: expectedAccessExpiresAt,
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
      mockedIdGenerator,
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
    mockReset(mockedIdGenerator)
    mockReset(mockedRequestOriginService)
    mockReset(activeSession3)
    mockReset(activeSession2)
    mockReset(activeSession1)

    mockedClock.now.mockReturnValue(now)
    mockedIdGenerator.generateId.mockReturnValue(expectedDomainEventId.value)
    mockedUserRepository.findByEmailWithLock.mockResolvedValue(user)
    mockedCredentialsRepository.findByUserId.mockResolvedValue(mockedCredential)
    mockedHasherService.compare.mockResolvedValue(true)
    mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })
    mockedSessionsRepository.findUserActiveSessions.mockResolvedValue([activeSession1, activeSession2, activeSession3])
    mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [] })
    mockedRequestOriginService.process.mockResolvedValue(expectedRequestOriginData)
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    activeSession1.isSameDeviceAs.mockReturnValue(false)
    activeSession2.isSameDeviceAs.mockReturnValue(false)
    activeSession3.isSameDeviceAs.mockReturnValue(false)

    request = {
      email: validEmail.value,
      password: UserPasswordMother.random().value,
      ip: '8.8.8.8',
      userAgent: validUA.value,
    }

    userSessionTestBuilder = new UserSessionTestBuilder()
      .withIpHash(validIpHash)
      .withUserAgent(validUA)
      .withUserId(validUserId)
      .withId(expectedSessionId)
      .withDeviceLocation(validDeviceLocation)
  })

  describe('happy path', () => {
    const checkCommonCalls = (expectedSession: UserSession, expectNewDevice: boolean, deviceLocation: DeviceLocation | null) => {
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
      expect(mockedCredentialsRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedRequestOriginService.process).toHaveBeenCalledWith(request.ip, request.userAgent, { email: validEmail.value })
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith(validEmail.value, fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedHasherService.compare).toHaveBeenCalledWith(request.password, validPasswordHash.value)

      expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(
        validUserId,
        now,
        expectedSession.userAgent,
        expectedSession.ipHash,
        deviceLocation,
      )
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId.value, now, fakeContext)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledWith(
        [activeSession1, activeSession2, activeSession3],
        now,
      )
      expect(mockedCredentialsRepository.update).toHaveBeenCalledWith(mockedCredential, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: validUserId,
          aggregateType: DomainEventAggregateType.user(),
          id: expectedDomainEventId,
          name: DomainEventName.successfulLogin(),
          occurredAt: now,
          payload: {
            userId: expectedSession.userId.value,
            sessionId: expectedSession.id.value,
            isNewDevice: expectNewDevice,
            deviceLocation: expectedSession.deviceLocation
              ? {
                  countryCode: expectedSession.deviceLocation.countryCode,
                  city: expectedSession.deviceLocation.city,
                }
              : null,
          },
          metadata: {
            ipHash: expectedSession.ipHash ? expectedSession.ipHash.value : null,
            ua: expectedSession.userAgent.value,
          },
        }),
        fakeContext,
      )
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledWith(now)
    }
    const checkResult = (result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>, newDevice: boolean) => {
      expect(result.success).toBe(true)
      expect(result).toStrictEqual({
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
    describe('when IP, UserAgent and DeviceLocation are available', () => {
      it('should call services and entities correctly and return the correct result when at least 1 session must to be revoked and is newDevice', async () => {
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [activeSession1] })

        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        checkCommonCalls(expectedSession, true, validDeviceLocation)
        checkResult(result, true)
      })

      it('should call services and entities correctly and return the correct result when any session must to be revoked and is not newDevice', async () => {
        activeSession3.isSameDeviceAs.mockReturnValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        checkCommonCalls(expectedSession, false, validDeviceLocation)
        checkResult(result, false)
      })
    })

    describe('when IP is NULL, UserAgent is unknown or DeviceLocation is NULL', () => {
      it('should call services and entities correctly and return the correct result when IP is NULL', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          ipHash: null,
          normalizedIp: null,
          deviceLocation: null,
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        checkCommonCalls(expectedSession, true, null)
        checkResult(result, true)
      })

      it('should call services and entities correctly and return the correct result when deviceLocation is NULL', async () => {
        const expectedSession = userSessionTestBuilder.withDeviceLocation(null).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          deviceLocation: null,
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        checkCommonCalls(expectedSession, true, null)
        checkResult(result, true)
      })

      it('calls services and entities and return the correct result when user-agent is unknown', async () => {
        const expectedSession = userSessionTestBuilder.withUserAgent(UserAgent.unknown()).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          userAgent: UserAgent.unknown(),
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        checkCommonCalls(expectedSession, true, validDeviceLocation)
        checkResult(result, true)
      })
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const invalidEmail = EmailAddressMother.invalid()
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, email: invalidEmail })

      expect(result).toMatchObject({
        success: false,
        error: LoginUserApplicationError.invalidUserEmail(invalidEmail),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when password format is not valid', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, password: UserPasswordMother.invalid() })

      expect(result).toMatchObject({
        success: false,
        error: LoginUserApplicationError.invalidPasswordFormat(),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toEqual({
          success: false,
          error: LoginUserApplicationError.userNotFound(validEmail.value),
        })
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

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.userDoesNotHaveCredentials(validUserId.value),
      })

      expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
        userId: validUserId.value,
        email: validEmail.value,
        reason: 'Active user has no credentials',
      })

      expect(mockedHasherService.compare).not.toHaveBeenCalled()
    })

    describe('when passwords do not match', () => {
      beforeEach(() => {
        mockedHasherService.compare.mockResolvedValue(false)
      })

      const expectedDomainEvent = {
        aggregateId: validUserId,
        aggregateType: DomainEventAggregateType.user(),
        id: expectedDomainEventId,
        name: DomainEventName.failedLoginAttempt(),
        occurredAt: now,
        payload: {
          userId: validUserId.value,
          deviceLocation: null,
        },
        metadata: {
          ipHash: validIpHash.value,
          ua: validUA.value,
        },
      }

      it('should return error and create the correct domain event when session hash ip is not NULL', async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(validUserId.value),
        })

        expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...expectedDomainEvent,
            payload: {
              userId: validUserId.value,
              deviceLocation: {
                countryCode: validDeviceLocation.countryCode,
                city: validDeviceLocation.city,
              },
            },
          }),
          fakeContext,
        )

        expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
        expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
        expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(1)
      })

      it('should return error and create the correct domain event when session hash ip is NULL', async () => {
        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          ipHash: null,
          normalizedIp: null,
          deviceLocation: null,
        })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(validUserId.value),
        })

        expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...expectedDomainEvent,
            metadata: {
              ipHash: null,
              ua: validUA.value,
            },
          }),
          fakeContext,
        )
      })
    })

    describe('when session cannot be revoked', () => {
      it('should return error if userSessionPolicyManager returns revocationFailed error', async () => {
        const expectedError = UserSessionPolicyManagerApplicationError.revocationFailed(
          `Cannot revoke session with ID ${activeSession1.id.value}`,
        )
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: false, error: expectedError })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.cannotRevokeSession(expectedError.message),
        })
      })

      it('should return error if UserSessionPolicyManagerApplicationService returns an unknown error', async () => {
        const unknownServiceError: UserSessionPolicyManagerApplicationError = {
          message: 'Unexpected error',
          id: 'unexpected-error',
          name: UserSessionPolicyManagerApplicationError.name,
        }
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({
          success: false,
          error: unknownServiceError,
        })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.internalError(`Unknown internal error: ${unknownServiceError.message}`),
        })
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
      })
    })

    it('should throw error when UserRepository fails', async () => {
      mockedUserRepository.findByEmailWithLock.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error when PasswordHasher fails', async () => {
      mockedHasherService.compare.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error when UserSessionRepository fails', async () => {
      mockedSessionsRepository.findUserActiveSessions.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error when DomainEventRepository fails', async () => {
      mockedDomainEventRepository.save.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })
  })
})
