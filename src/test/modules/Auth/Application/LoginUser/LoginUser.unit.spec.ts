/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
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
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'

describe('LoginUser', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialsRepository = mock<UserCredentialRepositoryInterface>()
  const mockedSessionsRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedPasswordHasher = mock<PasswordHasherServiceInterface>()
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

  const validEmail = UserEmailMother.valid()
  const validUserId = UserIdMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  const expectedSessionId = UserSessionIdMother.valid()
  const expectedDomainEventId = DomainEventIdMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  const expectedRequestOriginData: RequestOriginData = {
    userAgent: validUA,
    ipHash: validIpHash.toString(),
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

  const activeSession1 = mock<UserSession>({ id: UserSessionIdMother.valid() })
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
      mockedPasswordHasher,
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
    mockReset(mockedPasswordHasher)
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
    mockedIdGenerator.generateId.mockReturnValue(expectedDomainEventId.toString())
    mockedUserRepository.findByEmailWithLock.mockResolvedValue(user)
    mockedCredentialsRepository.findByUserId.mockResolvedValue(mockedCredential)
    mockedPasswordHasher.compare.mockResolvedValue(true)
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
      email: 'test@example.com',
      password: 'secret',
      ip: '203.0.113.10',
      userAgent: validUA.toString(),
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

      expect(mockedPasswordHasher.compare).toHaveBeenCalledTimes(1)
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.saveLoginSuccess).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedRequestOriginService.process).toHaveBeenCalledWith(request.ip, request.userAgent, validEmail)
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith('test@example.com', fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.toString(), fakeContext)
      expect(mockedPasswordHasher.compare).toHaveBeenCalledWith('secret', validPasswordHash.toString())

      expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(
        validUserId,
        now,
        expectedSession.userAgent,
        expectedSession.ipHash,
        deviceLocation,
      )
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId.toString(), now, fakeContext)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledWith(
        [activeSession1, activeSession2, activeSession3],
        now,
      )
      expect(mockedCredentialsRepository.saveLoginSuccess).toHaveBeenCalledWith(mockedCredential, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: DomainEventAggregateId.fromString(validUserId.toString()),
          aggregateType: DomainEventAggregateType.user(),
          id: expectedDomainEventId,
          name: DomainEventName.successfulLogin(),
          occurredAt: now,
          payload: {
            userId: expectedSession.userId.toString(),
            sessionId: expectedSession.id.toString(),
            isNewDevice: expectNewDevice,
            deviceLocation: expectedSession.deviceLocation
              ? {
                  countryCode: expectedSession.deviceLocation.countryCode,
                  city: expectedSession.deviceLocation.city,
                }
              : null,
          },
          metadata: {
            ipHash: expectedSession.ipHash ? expectedSession.ipHash.toString() : null,
            ua: expectedSession.userAgent.toString(),
          },
        }),
        fakeContext,
      )
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledWith(now)
    }

    describe('when input is valid and services do not fail', () => {
      it('should call services and entities correctly when at least 1 session must to be revoked and is newDevice', async () => {
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [activeSession1] })

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, true, validDeviceLocation)
      })

      it('should call services and entities correctly when any session must to be revoked and is not newDevice', async () => {
        activeSession3.isSameDeviceAs.mockReturnValue(true)

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, false, validDeviceLocation)
      })

      it('should return the correct response', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute(request)

        expect(result.success).toBe(true)
        expect(result).toStrictEqual({
          success: true,
          value: {
            refreshToken: 'refresh-clear-token',
            accessToken: 'access-jwt-token',
            accessTokenExpiresAt: expectedAccessExpiresAt,
            sessionId: expectedSessionId.toString(),
            refreshTokenExpiresAt: expectedRefreshExpiresAt,
            isNewDevice: true,
          },
        })
      })
    })

    describe('when IP, UserAgent is invalid or DeviceLocation cannot be resolved', () => {
      it('should call services and entities correctly when IP is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          ipHash: null,
          normalizedIp: null,
          deviceLocation: null,
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, true, null)
      })

      it('should call services and entities correctly when deviceLocation cannot be resolved', async () => {
        const expectedSession = userSessionTestBuilder.withDeviceLocation(null).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          deviceLocation: null,
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, true, null)
      })

      it('calls services and entities when user-agent is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withUserAgent(UserAgent.unknown()).build()

        mockedRequestOriginService.process.mockResolvedValue({
          ...expectedRequestOriginData,
          userAgent: UserAgent.unknown(),
        })
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, true, validDeviceLocation)
      })
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, email: 'not-an-email' })

      expect(result).toMatchObject({
        success: false,
        error: LoginUserApplicationError.invalidUserEmail('not-an-email'),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should throw error if user email validation fails with an unexpected error', async () => {
      const useCase = buildUseCase()

      jest.spyOn(UserEmail, 'fromString').mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toEqual({
          success: false,
          error: LoginUserApplicationError.userNotFound('test@example.com'),
        })
      }

      it('should return error when user does not exist', async () => {
        mockedUserRepository.findByEmailWithLock.mockResolvedValue(null)

        await runTestCaseAndAssertResult()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login attempt failed: User not found or inactive', {
          email: validEmail.toString(),
          reason: 'NotFound',
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

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login attempt failed: User not found or inactive', {
          email: validEmail.toString(),
          reason: 'Inactive',
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

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login attempt failed: User not found or inactive', {
          email: validEmail.toString(),
          reason: 'Inactive',
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
        error: LoginUserApplicationError.userDoesNotHaveCredentials(validUserId.toString()),
      })

      expect(mockedLogger.error).toHaveBeenCalledWith('Login failed: User exists but has no credentials', undefined, {
        userId: validUserId.toString(),
        email: validEmail.toString(),
      })

      expect(mockedPasswordHasher.compare).not.toHaveBeenCalled()
    })

    describe('when passwords do not match', () => {
      beforeEach(() => {
        mockedPasswordHasher.compare.mockResolvedValue(false)
      })

      const expectedDomainEvent = {
        aggregateId: DomainEventAggregateId.fromString(validUserId.toString()),
        aggregateType: DomainEventAggregateType.user(),
        id: expectedDomainEventId,
        name: DomainEventName.failedLoginAttempt(),
        occurredAt: now,
        payload: {
          userId: validUserId.toString(),
          deviceLocation: null,
        },
        metadata: {
          ipHash: validIpHash.toString(),
          ua: validUA.toString(),
        },
      }

      it('should return error and create the correct domain event when session hash ip is not NULL', async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(validUserId.toString()),
        })

        expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...expectedDomainEvent,
            payload: {
              userId: validUserId.toString(),
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
          error: LoginUserApplicationError.invalidCredentials(validUserId.toString()),
        })

        expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...expectedDomainEvent,
            metadata: {
              ipHash: null,
              ua: validUA.toString(),
            },
          }),
          fakeContext,
        )
      })
    })

    describe('when session cannot be revoked', () => {
      it('should return error if userSessionPolicyManager returns revocationFailed error', async () => {
        const expectedError = UserSessionPolicyManagerApplicationError.revocationFailed(
          `Cannot revoke session with ID ${activeSession1.id.toString()}`,
        )
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: false, error: expectedError })

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.cannotRevokeSession(expectedError.message),
        })
      })

      it('should return error if userSessionPolicyManager returns an unknown error', async () => {
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

      it('should return error if userSessionPolicyManager fails', async () => {
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
      })
    })

    it('should throw error if userRepository fails', async () => {
      mockedUserRepository.findByEmailWithLock.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error if userSessionRepository fails', async () => {
      mockedSessionsRepository.findUserActiveSessions.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })

    it('should throw error if domainEventRepository fails', async () => {
      mockedDomainEventRepository.save.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(request)).rejects.toThrow(Error('Unexpected Error'))
    })
  })
})
