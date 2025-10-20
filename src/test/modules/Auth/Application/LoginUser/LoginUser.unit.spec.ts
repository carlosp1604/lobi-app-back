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
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
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
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'
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
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'

describe('LoginUser', () => {
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const now = new Date('2025-01-02T03:04:05.000Z')

  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)

  const validEmail = UserEmailMother.valid()
  const validUserId = UserIdMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()
  const validHashToken = UserSessionHashMother.valid()

  const expectedSessionId = UserSessionIdMother.valid()
  const expectedDomainEventId = DomainEventIdMother.valid()
  const inputUA = UserAgentMother.valid()
  const expectedUA = UserAgentMother.valid()
  const deviceLocation = DeviceLocationMother.valid()
  const expectedResolvedDeviceLocation: ResolvedDeviceLocation = {
    countryCode: deviceLocation.countryCode,
    city: deviceLocation.city,
  }

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

  const mockedActiveSession1 = mock<UserSession>({
    expiresAt: now,
    revokedAt: null,
    userId: validUserId,
    id: UserSessionIdMother.valid(),
  })

  const mockedActiveSession2 = mock<UserSession>()
  const mockedActiveSession3 = mock<UserSession>()

  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialsRepository = mock<UserCredentialRepositoryInterface>()
  const mockedSessionsRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedPasswordHasher = mock<PasswordHasherServiceInterface>()
  const mockedGenerateTokensService = mock<GenerateTokensApplicationService>()
  const mockedHasher = mock<HasherServiceInterface>()
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()
  const mockedMaxSessionPolicy = mock<MaxSessionsPolicy>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedIpValidator = mock<IpValidatorServiceInterface>()

  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  const expectedGenerateTokensResponse: GenerateTokensApplicationResponseDto = {
    session: userSessionTestBuilder.build(),
    refreshToken: 'refresh-clear',
    accessToken: 'access.jwt.mock',
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
      mockedHasher,
      mockedDeviceLocationResolver,
      mockedMaxSessionPolicy,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGenerator,
      mockedIpValidator,
    )
  }

  const resetAllMocks = () => {
    mockReset(mockedUserRepository)
    mockReset(mockedCredentialsRepository)
    mockReset(mockedSessionsRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedPasswordHasher)
    mockReset(mockedGenerateTokensService)
    mockReset(mockedHasher)
    mockReset(mockedDeviceLocationResolver)
    mockReset(mockedMaxSessionPolicy)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedIpValidator)
    mockReset(mockedLogger)
    mockReset(mockedIdGenerator)
    mockReset(mockedActiveSession3)
    mockReset(mockedActiveSession2)
    mockReset(mockedActiveSession1)
  }

  describe('happy path', () => {
    let input: LoginUserApplicationRequestDto

    beforeEach(() => {
      resetAllMocks()
      mockedClock.now.mockReturnValue(now)
      mockedIdGenerator.generateId.mockReturnValueOnce(expectedDomainEventId.toString())
      mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(user)
      mockedCredentialsRepository.findByUserId.mockResolvedValueOnce(mockedCredential)
      mockedPasswordHasher.compare.mockResolvedValue(true)
      mockedHasher.hash.mockResolvedValueOnce(validIpHash.toString())
      mockedHasher.hash.mockResolvedValueOnce(validHashToken.toString())
      mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
        return work(fakeContext)
      })
      mockedSessionsRepository.findUserActiveSessions.mockResolvedValueOnce([
        mockedActiveSession1,
        mockedActiveSession2,
        mockedActiveSession3,
      ])

      mockedActiveSession1.isSameDeviceAs.mockReturnValueOnce(false)
      mockedActiveSession2.isSameDeviceAs.mockReturnValueOnce(false)

      input = {
        email: 'test@example.com',
        password: 'secret',
        ip: '203.0.113.10',
        userAgent: inputUA.toString(),
      }
    })

    const mockValidIp = () => {
      mockedIpValidator.isValid.mockReturnValueOnce(true)
      mockedIpValidator.isPublic.mockReturnValueOnce(true)
      mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')
    }

    const checkCommonCalls = (expectedSession: UserSession, expectNewDevice: boolean) => {
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
      expect(mockedActiveSession1.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedActiveSession2.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedActiveSession3.isSameDeviceAs).toHaveBeenCalledTimes(1)
      expect(mockedMaxSessionPolicy.sessionsToRevoke).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
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
      expect(mockedActiveSession1.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedActiveSession2.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedActiveSession3.isSameDeviceAs).toHaveBeenCalledWith(expectedSession)
      expect(mockedMaxSessionPolicy.sessionsToRevoke).toHaveBeenCalledWith([
        mockedActiveSession1,
        mockedActiveSession2,
        mockedActiveSession3,
      ])
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
      const expectedSession = userSessionTestBuilder.build()

      beforeEach(() => {
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })
        mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)
      })

      it('calls services and entities correctly when at least 1 session must to be revoked and is newDevice', async () => {
        mockValidIp()
        mockedMaxSessionPolicy.sessionsToRevoke.mockReturnValueOnce([mockedActiveSession1])
        mockedActiveSession3.isSameDeviceAs.mockReturnValueOnce(false)

        const useCase = buildUseCase()
        await useCase.execute(input)

        checkCommonCalls(expectedSession, true)

        expect(mockedActiveSession2.revoke).not.toHaveBeenCalled()
        expect(mockedActiveSession3.revoke).not.toHaveBeenCalled()
        expect(mockedActiveSession1.revoke).toHaveBeenCalledTimes(1)
        expect(mockedActiveSession1.revoke).toHaveBeenCalledWith(now)
      })

      it('calls services and entities correctly when any session must to be revoked and is not newDevice', async () => {
        mockValidIp()
        mockedMaxSessionPolicy.sessionsToRevoke.mockReturnValueOnce([])
        mockedActiveSession3.isSameDeviceAs.mockReturnValueOnce(true)

        const useCase = buildUseCase()
        await useCase.execute(input)

        checkCommonCalls(expectedSession, false)

        expect(mockedActiveSession1.revoke).not.toHaveBeenCalled()
        expect(mockedActiveSession2.revoke).not.toHaveBeenCalled()
        expect(mockedActiveSession3.revoke).not.toHaveBeenCalled()
      })

      it('returns the correct response', async () => {
        mockValidIp()
        mockedMaxSessionPolicy.sessionsToRevoke.mockReturnValueOnce([])
        mockedActiveSession3.isSameDeviceAs.mockReturnValueOnce(false)

        const useCase = buildUseCase()
        const result = await useCase.execute(input)

        if (!result.success) {
          expect(false).toBe(true)

          return
        }

        expect(result).toStrictEqual({
          success: true,
          value: {
            accessToken: 'access.jwt.mock',
            refreshToken: 'refresh-clear',
            accessTokenExpiresAt: expectedAccessExpiresAt,
            sessionId: expectedSessionId.toString(),
            refreshTokenExpiresAt: expectedRefreshExpiresAt,
            isNewDevice: true,
          },
        })
      })
    })

    describe('when IP or UA are not valid or deviceLocationResolver fails', () => {
      beforeEach(() => {
        mockedMaxSessionPolicy.sessionsToRevoke.mockReturnValueOnce([])
        mockedActiveSession3.isSameDeviceAs.mockReturnValueOnce(true)
      })

      it('calls services and entities correctly when ip is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithInvalidIp = {
          ...input,
          ip: 'invalid-ip',
        }

        mockedIpValidator.isValid.mockReturnValueOnce(false)

        const useCase = buildUseCase()
        await useCase.execute(inputWithInvalidIp)

        expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
        expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
        expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
        expect(mockedHasher.hash).not.toHaveBeenCalled()

        expect(mockedIpValidator.isValid).toHaveBeenCalledWith('invalid-ip')
        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'IP invalid',
          expect.objectContaining({
            userId: validUserId.toString(),
            userAgent: expectedUA.toString(),
            userIp: inputWithInvalidIp.ip,
          }),
        )
      })

      it('calls services and entities correctly when ip is valid but it is not public', async () => {
        const expectedSession = userSessionTestBuilder.withIpHash(null).build()
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithPrivateIP = {
          ...input,
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
          'IP invalid',
          expect.objectContaining({
            userId: validUserId.toString(),
            userAgent: expectedUA.toString(),
            userIp: inputWithPrivateIP.ip,
          }),
        )
      })

      it('calls services and entities correctly when device location resolver fails', async () => {
        const expectedSession = userSessionTestBuilder.withDeviceLocation(null).build()

        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })
        mockedIpValidator.isValid.mockReturnValueOnce(true)
        mockedIpValidator.isPublic.mockReturnValueOnce(true)
        mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')
        mockedDeviceLocationResolver.resolve.mockImplementationOnce(() => {
          throw Error('Service Error')
        })

        const useCase = buildUseCase()
        await useCase.execute(input)

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Device location resolver failed',
          expect.any(String),
          expect.objectContaining({
            userEmail: validEmail.toString(),
            ip: 'normalized-ip',
            userAgent: expectedUA.toString(),
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
        await useCase.execute(input)

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Device location resolver failed',
          expect.any(String),
          expect.objectContaining({
            userEmail: validEmail.toString(),
            ip: 'normalized-ip',
            userAgent: expectedUA.toString(),
            error: 'Service Error',
          }),
        )
      })

      it('calls services and entities when user-agent is not valid', async () => {
        const expectedSession = userSessionTestBuilder.withUserAgent(UserAgent.unknown()).build()
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })

        const inputWithInvalidUA = {
          ...input,
          userAgent: 'a'.repeat(513),
        }

        mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)
        mockValidIp()

        const useCase = buildUseCase()
        await useCase.execute(inputWithInvalidUA)

        expect(mockedLogger.warn).toHaveBeenCalledWith(
          'UA invalid, using fallback',
          expect.objectContaining({
            userEmail: validEmail.toString(),
            uaSample: 'a'.repeat(512),
            uaLength: 513,
          }),
        )
      })
    })
  })

  describe('when there are errors', () => {
    let baseInput: LoginUserApplicationRequestDto

    beforeEach(() => {
      resetAllMocks()
      mockedClock.now.mockReturnValue(now)
      mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => work(fakeContext))

      baseInput = {
        email: 'john@example.com',
        password: 'secret',
        ip: '203.0.113.10',
        userAgent: inputUA.toString(),
      }
    })

    it('should return error when email is not valid', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...baseInput, email: 'not-an-email' })

      expect(result).toMatchObject({
        success: false,
        error: LoginUserApplicationError.invalidUserEmail('not-an-email'),
      })

      expect(mockedUserRepository.findByEmailWithLock).not.toHaveBeenCalled()
      expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
    })

    describe('when user does not exist or does not have credentials', () => {
      const checkFlowHasStoppedCorrectly = () => {
        expect(mockedIpValidator.isValid).not.toHaveBeenCalled()
        expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
        expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
        expect(mockedHasher.hash).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
      }

      it('should return error when user does not exist', async () => {
        mockedHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())
        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(null)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userNotFound('john@example.com'),
        })

        checkFlowHasStoppedCorrectly()
        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return error if user is removed or deactivated', async () => {
        mockedHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())

        const deletedUser = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.deactivated())
          .withDeletedAt(now)
          .build()

        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(deletedUser)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userNotFound('john@example.com'),
        })

        checkFlowHasStoppedCorrectly()
        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return error if user does not have a credential', async () => {
        mockedHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())

        const user = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.active())
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(user)
        mockedCredentialsRepository.findByUserId.mockResolvedValueOnce(null)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials(user.id.toString()),
        })

        checkFlowHasStoppedCorrectly()
      })
    })

    describe('when passwords do not match', () => {
      beforeEach(() => {
        const ipHash = UserSessionIpHashMother.valid().toString()
        mockedHasher.hash.mockResolvedValueOnce(ipHash)
        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(user)
        mockedCredentialsRepository.findByUserId.mockResolvedValueOnce(mockedCredential)
        mockedPasswordHasher.compare.mockResolvedValueOnce(false)
        mockedIdGenerator.generateId.mockReturnValueOnce(expectedDomainEventId.toString())
        mockedIpValidator.isPublic.mockReturnValueOnce(true)
        mockedIpValidator.normalize.mockReturnValueOnce('normalize-ip')
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
        mockedIpValidator.isValid.mockReturnValueOnce(true)
        mockedDeviceLocationResolver.resolve.mockResolvedValueOnce(expectedResolvedDeviceLocation)

        const result = await buildUseCase().execute(baseInput)

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
        mockedIpValidator.isValid.mockReturnValueOnce(false)
        mockedDeviceLocationResolver.resolve.mockResolvedValueOnce(deviceLocation)

        const result = await buildUseCase().execute(baseInput)

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

      it('should return error and create the correct domain event when session hash ip is NULL', async () => {
        mockedIpValidator.isValid.mockReturnValueOnce(false)

        const result = await buildUseCase().execute(baseInput)

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
      const expectedSession = userSessionTestBuilder.build()

      beforeEach(() => {
        const ipHash = UserSessionIpHashMother.valid().toString()
        mockedHasher.hash.mockResolvedValueOnce(ipHash)
        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(user)
        mockedCredentialsRepository.findByUserId.mockResolvedValueOnce(mockedCredential)
        mockedPasswordHasher.compare.mockResolvedValueOnce(true)
        mockedIdGenerator.generateId.mockReturnValueOnce(expectedDomainEventId.toString())
        mockedIpValidator.isPublic.mockReturnValueOnce(true)
        mockedIpValidator.normalize.mockReturnValueOnce('normalize-ip')
        mockedGenerateTokensService.generate.mockResolvedValueOnce({ ...expectedGenerateTokensResponse, session: expectedSession })
        mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)
        mockedSessionsRepository.findUserActiveSessions.mockResolvedValueOnce([mockedActiveSession1, mockedActiveSession2])
        mockedMaxSessionPolicy.sessionsToRevoke.mockReturnValueOnce([mockedActiveSession1])
        mockedActiveSession1.isSameDeviceAs.mockReturnValueOnce(false)
        mockedActiveSession2.isSameDeviceAs.mockReturnValueOnce(false)
      })

      it('should return error if session cannot be revoked', async () => {
        const expectedError = UserSessionDomainException.sessionAlreadyRevoked(expectedSessionId.toString())
        mockedActiveSession1.revoke.mockImplementationOnce(() => {
          throw expectedError
        })

        const useCase = buildUseCase()

        const result = await useCase.execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.cannotRevokeSession(expectedError.message),
        })

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Cannot revoke session',
          expect.any(String),
          expect.objectContaining({
            sessionId: mockedActiveSession1.id.toString(),
            userId: mockedActiveSession1.userId.toString(),
            revokedAt: mockedActiveSession1.revokedAt,
            expiresAt: mockedActiveSession1.expiresAt,
          }),
        )
      })

      it('should throw error if revoke session fails with an error', async () => {
        mockedActiveSession1.revoke.mockImplementationOnce(() => {
          throw Error('Unexpected error')
        })

        const useCase = buildUseCase()

        await expect(() => useCase.execute(baseInput)).rejects.toThrow(
          Error(`Unexpected error while revoking session ${mockedActiveSession1.id.toString()}`),
        )

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Unexpected error while revoking session',
          expect.any(String),
          expect.objectContaining({
            sessionId: mockedActiveSession1.id.toString(),
            userId: mockedActiveSession1.userId.toString(),
            revokedAt: mockedActiveSession1.revokedAt,
            expiresAt: mockedActiveSession1.expiresAt,
            error: Error('Unexpected error'),
          }),
        )
      })

      it('should throw error if revoke session fails without an error', async () => {
        mockedActiveSession1.revoke.mockImplementationOnce(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'Unexpected error'
        })

        const useCase = buildUseCase()

        await expect(() => useCase.execute(baseInput)).rejects.toThrow(
          Error(`Unexpected error while revoking session ${mockedActiveSession1.id.toString()}`),
        )

        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Unexpected error while revoking session',
          expect.any(String),
          expect.objectContaining({
            sessionId: mockedActiveSession1.id.toString(),
            userId: mockedActiveSession1.userId.toString(),
            revokedAt: mockedActiveSession1.revokedAt,
            expiresAt: mockedActiveSession1.expiresAt,
            error: 'Unexpected error',
          }),
        )
      })
    })

    it('should throw error if an unexpected error occurs', async () => {
      mockedHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())
      mockedUserRepository.findByEmailWithLock.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(baseInput)).rejects.toThrow(Error('Unexpected Error'))
    })
  })
})
