/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import {
  DeviceLocationResolverServiceInterface,
  ResolvedDeviceLocation,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
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
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { IpValidatorServiceInterface } from '~/src/modules/Auth/Domain/IpValidatorServiceInterface'
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

describe('LoginUser', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialsRepository = mock<UserCredentialRepositoryInterface>()
  const mockedSessionsRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedPasswordHasher = mock<PasswordHasherServiceInterface>()
  const mockedGenerateTokensService = mock<GenerateTokensApplicationService>()
  const mockedUserSessionPolicyManagerService = mock<UserSessionPolicyManagerApplicationService>()
  const mockedHasher = mock<HasherServiceInterface>()
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedIpValidator = mock<IpValidatorServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  const now = new Date('2025-01-02T03:04:05.000Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)

  const validEmail = UserEmailMother.valid()
  const validUserId = UserIdMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()
  const validHashToken = UserSessionTokenHashMother.valid()

  const expectedSessionId = UserSessionIdMother.valid()
  const expectedDomainEventId = DomainEventIdMother.valid()
  const inputUA = UserAgentMother.valid()
  const expectedUA = UserAgentMother.valid()
  const deviceLocation = DeviceLocationMother.valid()
  const expectedResolvedDeviceLocation: ResolvedDeviceLocation = {
    countryCode: deviceLocation.countryCode,
    city: deviceLocation.city,
  }

  let request: LoginUserApplicationRequestDto

  const mockedCredential = mock<UserCredential>({ passwordHash: validPasswordHash })

  const user = new UserTestBuilder()
    .withId(validUserId)
    .withEmail(validEmail)
    .withStatus(UserStatus.active())
    .withDeletedAt(null)
    .build()

  const userSessionTestBuilder = new UserSessionTestBuilder()
    .withIpHash(validIpHash)
    .withUserAgent(expectedUA)
    .withUserId(validUserId)
    .withId(expectedSessionId)
    .withDeviceLocation(deviceLocation)

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

  const mockValidIp = () => {
    mockedIpValidator.isValid.mockReturnValue(true)
    mockedIpValidator.isPublic.mockReturnValue(true)
    mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')
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
      mockedHasher,
      mockedDeviceLocationResolver,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGenerator,
      mockedIpValidator,
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
    mockReset(mockedHasher)
    mockReset(mockedDeviceLocationResolver)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedIpValidator)
    mockReset(mockedLogger)
    mockReset(mockedIdGenerator)
    mockReset(activeSession3)
    mockReset(activeSession2)
    mockReset(activeSession1)
    jest.restoreAllMocks()

    mockedClock.now.mockReturnValue(now)
    mockedIdGenerator.generateId.mockReturnValue(expectedDomainEventId.toString())
    mockedUserRepository.findByEmailWithLock.mockResolvedValue(user)
    mockedCredentialsRepository.findByUserId.mockResolvedValue(mockedCredential)
    mockedPasswordHasher.compare.mockResolvedValue(true)
    mockedHasher.hash.mockResolvedValue(validIpHash.toString())
    mockedHasher.hash.mockResolvedValue(validHashToken.toString())
    mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })
    mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)
    mockedSessionsRepository.findUserActiveSessions.mockResolvedValue([activeSession1, activeSession2, activeSession3])
    mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [] })
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
      userAgent: inputUA.toString(),
    }
  })

  describe('happy path', () => {
    const checkCommonCalls = (expectedSession: UserSession, expectNewDevice: boolean, deviceLocation: DeviceLocation | null) => {
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedHasher.hash).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledTimes(1)

      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.normalize).toHaveBeenCalledTimes(1)

      expect(mockedPasswordHasher.compare).toHaveBeenCalledTimes(1)
      expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(activeSession1.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession2.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(activeSession3.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.saveLoginSuccess).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedHasher.hash).toHaveBeenCalledWith('normalized-ip')
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith('test@example.com', fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.toString(), fakeContext)
      expect(mockedPasswordHasher.compare).toHaveBeenCalledWith('secret', validPasswordHash.toString())

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith('203.0.113.10')
      expect(mockedIpValidator.isPublic).toHaveBeenCalledWith('203.0.113.10')
      expect(mockedIpValidator.normalize).toHaveBeenCalledWith('203.0.113.10')

      expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledWith('normalized-ip')
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(validUserId, now, expectedUA, validIpHash, deviceLocation)
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
      it('calls services and entities correctly when at least 1 session must to be revoked and is newDevice', async () => {
        mockValidIp()
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [activeSession1] })

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, true, deviceLocation)
      })

      it('calls services and entities correctly when any session must to be revoked and is not newDevice', async () => {
        mockedDeviceLocationResolver.resolve.mockResolvedValue(null)
        mockValidIp()
        activeSession3.isSameDeviceAs.mockReturnValue(true)

        const useCase = buildUseCase()
        await useCase.execute(request)

        checkCommonCalls(expectedSession, false, null)
      })

      it('returns the correct response', async () => {
        mockValidIp()

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

    describe('when IP or UA are not valid or deviceLocationResolver fails', () => {
      it('calls services and entities correctly when IP is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithInvalidIp = {
          ...request,
          ip: 'invalid-ip-with-an-excessive-length-to-validate-proper-slice',
        }

        mockedIpValidator.isValid.mockReturnValueOnce(false)

        const useCase = buildUseCase()
        await useCase.execute(inputWithInvalidIp)

        expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
        expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
        expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
        expect(mockedHasher.hash).not.toHaveBeenCalled()

        expect(mockedIpValidator.isValid).toHaveBeenCalledWith('invalid-ip-with-an-excessive-length-to-validate-proper-slice')
        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Invalid or private IP address',
          expect.objectContaining({
            email: validEmail.toString(),
            userAgent: request.userAgent.toString(),
            ipSample: inputWithInvalidIp.ip.slice(0, 39),
            ipLength: inputWithInvalidIp.ip.length,
          }),
        )
      })

      it('calls services and entities correctly when IP is valid but it is not public', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()
        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithPrivateIP = {
          ...request,
          ip: 'private-ip',
        }

        mockedIpValidator.isValid.mockReturnValueOnce(true)
        mockedIpValidator.isPublic.mockReturnValueOnce(false)

        const useCase = buildUseCase()
        await useCase.execute(inputWithPrivateIP)

        expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
        expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)
        expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
        expect(mockedHasher.hash).not.toHaveBeenCalled()

        expect(mockedIpValidator.isValid).toHaveBeenCalledWith('private-ip')
        expect(mockedIpValidator.isPublic).toHaveBeenCalledWith('private-ip')
        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Invalid or private IP address',
          expect.objectContaining({
            email: validEmail.toString(),
            userAgent: request.userAgent.toString(),
            ipSample: inputWithPrivateIP.ip,
            ipLength: inputWithPrivateIP.ip.length,
          }),
        )
      })

      it('calls services and entities correctly when device location resolver fails', async () => {
        const expectedSession = userSessionTestBuilder.withDeviceLocation(null).build()

        mockedGenerateTokensService.generate.mockResolvedValue({ ...expectedGenerateTokensResponse, session: expectedSession })
        mockedIpValidator.isValid.mockReturnValue(true)
        mockedIpValidator.isPublic.mockReturnValue(true)
        mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')
        mockedDeviceLocationResolver.resolve.mockImplementation(() => {
          throw Error('Service Error')
        })

        const useCase = buildUseCase()
        await useCase.execute(request)

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Failed to resolve device location. Session will be created without location data',
          expect.any(String),
          expect.objectContaining({
            email: validEmail.toString(),
            ip: request.ip,
            userAgent: request.userAgent,
            error: Error('Service Error'),
          }),
        )
      })

      it('calls services and entities correctly when device location resolver fails without an error', async () => {
        const expectedSession = userSessionTestBuilder.withDeviceLocation(null).build()

        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })
        mockValidIp()
        mockedDeviceLocationResolver.resolve.mockImplementationOnce(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'Service Error'
        })

        const useCase = buildUseCase()
        await useCase.execute(request)

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Failed to resolve device location. Session will be created without location data',
          undefined,
          expect.objectContaining({
            email: validEmail.toString(),
            ip: request.ip,
            userAgent: request.userAgent,
            error: 'Service Error',
          }),
        )
      })

      it('calls services and entities when user-agent is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withUserAgent(UserAgent.unknown()).build()
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithInvalidUA = {
          ...request,
          userAgent: 'a'.repeat(513),
        }

        mockValidIp()

        const useCase = buildUseCase()
        await useCase.execute(inputWithInvalidUA)

        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Unparseable UserAgent, falling back to UNKNOWN',
          expect.objectContaining({
            email: validEmail.toString(),
            ip: request.ip,
            uaSample: 'a'.repeat(512),
            uaLength: 513,
          }),
        )
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

    it('should throw error if user agent validation fails with an unexpected error', async () => {
      const useCase = buildUseCase()

      jest.spyOn(UserAgent, 'fromString').mockImplementationOnce(() => {
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

        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: User not found or inactive',
          expect.objectContaining({
            email: validEmail.toString(),
            userAgent: request.userAgent.toString(),
            ip: request.ip,
            reason: 'NotFound',
          }),
        )
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

        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: User not found or inactive',
          expect.objectContaining({
            email: validEmail.toString(),
            userAgent: request.userAgent.toString(),
            ip: request.ip,
            reason: 'Inactive',
          }),
        )
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

        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: User not found or inactive',
          expect.objectContaining({
            email: validEmail.toString(),
            userAgent: request.userAgent.toString(),
            ip: request.ip,
            reason: 'Inactive',
          }),
        )
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

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Login failed: User exists but has no credentials',
        undefined,
        expect.objectContaining({
          userId: validUserId.toString(),
          email: validEmail.toString(),
          userAgent: request.userAgent.toString(),
          ip: request.ip,
        }),
      )

      expect(mockedDeviceLocationResolver.resolve).not.toHaveBeenCalled()
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
          ua: expectedUA.toString(),
        },
      }

      it('should return error and create the correct domain event when session hash ip is not NULL', async () => {
        mockValidIp()
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
                countryCode: deviceLocation.countryCode,
                city: deviceLocation.city,
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
        mockedIpValidator.isValid.mockReturnValue(false)

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
              ua: expectedUA.toString(),
            },
          }),
          fakeContext,
        )
      })
    })

    describe('when session cannot be revoked', () => {
      beforeEach(() => {
        mockValidIp()
      })

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
