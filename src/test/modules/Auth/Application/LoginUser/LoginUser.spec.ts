/* eslint @typescript-eslint/unbound-method: 0 */
import { mock } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGenerator'
import { TokenHasherServiceInterface } from '~/src/modules/Auth/Domain/TokenHasherServiceInterface'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { LockoutPolicy } from '~/src/modules/Auth/Application/Policies/LockoutUserCredentialPolicy'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { Relationship } from '~/src/modules/Shared/Domain/Relationship/Relationship'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
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

describe('LoginUser', () => {
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const now = new Date('2025-01-02T03:04:05.000Z')

  const accessTtlMilliseconds = 10
  const sessionTtlMilliseconds = 10

  const validEmail = UserEmailMother.valid()
  const validUserId = UserIdMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()
  const validHashToken = UserSessionHashMother.valid()

  const expectedSessionId = UserSessionIdMother.valid()
  const expectedDomainEventId = DomainEventIdMother.valid()
  const expectedUA = UserAgent.fromString('LobiApp/1.0 (CarlosP at the controls)')
  const expectedUnknownUA = UserAgent.unknown()

  const mockedCredential = mock<UserCredential>({ passwordHash: validPasswordHash })
  const mockedRelationship = mock<Relationship<UserCredential>>({ getOrNull: () => mockedCredential })

  const user = new UserTestBuilder()
    .withId(validUserId)
    .withEmail(validEmail)
    .withStatus(UserStatus.active())
    .withCredential(mockedRelationship)
    .withDeletedAt(null)
    .build()

  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialsRepository = mock<UserCredentialRepositoryInterface>()
  const mockedSessionsRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedPasswordHasher = mock<PasswordHasherServiceInterface>()
  const mockedTokenGenerator = mock<TokenGeneratorApplicationServiceInterface>()
  const mockedTokenHasher = mock<TokenHasherServiceInterface>()
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()
  const mockedMaxSessionPolicy = mock<MaxSessionsPolicy>({ maxSessions: 3 })
  const mockedLockoutPolicy = mock<LockoutPolicy>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedIpValidator = mock<IpValidatorServiceInterface>()

  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  const buildUseCase = () => {
    return new LoginUser(
      mockedUserRepository,
      mockedCredentialsRepository,
      mockedSessionsRepository,
      mockedDomainEventRepository,
      mockedPasswordHasher,
      mockedTokenGenerator,
      mockedTokenHasher,
      mockedDeviceLocationResolver,
      mockedMaxSessionPolicy,
      mockedLockoutPolicy,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGenerator,
      mockedIpValidator,
      accessTtlMilliseconds,
      sessionTtlMilliseconds,
    )
  }

  describe('happy path', () => {
    let input: LoginUserApplicationRequestDto

    beforeEach(() => {
      jest.resetAllMocks()
      mockedClock.now.mockReturnValue(now)
      mockedIdGenerator.generateId
        .mockReturnValueOnce(expectedSessionId.toString())
        .mockReturnValueOnce(expectedDomainEventId.toString())
      mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
        return work(fakeContext)
      })
      mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(user)
      mockedPasswordHasher.compare.mockResolvedValue(true)
      mockedTokenHasher.hash.mockResolvedValueOnce(validIpHash.toString())
      mockedTokenHasher.hash.mockResolvedValueOnce(validHashToken.toString())
      mockedTokenGenerator.generateSessionToken.mockResolvedValueOnce('refresh-clear')
      mockedTokenGenerator.generateAccessToken.mockResolvedValueOnce('access.jwt.mock')
      mockedSessionsRepository.existsDevice.mockResolvedValue(true)
      mockedLockoutPolicy.evaluateLock.mockReturnValue(null)

      input = {
        email: 'test@example.com',
        password: 'secret',
        ip: '203.0.113.10',
        userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
      }
    })

    describe('when IP is not valid or is not public', () => {
      it('calls services and entities correctly when ip is not valid', async () => {
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
    })

    it('calls services and entities correctly', async () => {
      mockedDeviceLocationResolver.resolve.mockResolvedValue({ country: 'ES', city: 'Madrid', timezone: 'Europe/Madrid' })
      mockedIpValidator.isValid.mockReturnValueOnce(true)
      mockedIpValidator.isPublic.mockReturnValueOnce(true)
      mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')

      const useCase = buildUseCase()
      await useCase.execute(input)

      expect(mockedTokenHasher.hash).toHaveBeenCalledTimes(2)
      expect(mockedUserRepository.findByEmailWithCredentials).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.normalize).toHaveBeenCalledTimes(1)
      expect(mockedPasswordHasher.compare).toHaveBeenCalledTimes(1)
      expect(mockedLockoutPolicy.evaluateLock).not.toHaveBeenCalled()
      expect(mockedCredentialsRepository.saveFailedAttempts).not.toHaveBeenCalled()
      expect(mockedCredentialsRepository.saveLock).not.toHaveBeenCalled()
      expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedTokenGenerator.generateAccessToken).toHaveBeenCalledTimes(1)
      expect(mockedTokenGenerator.generateSessionToken).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.existsDevice).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.saveLoginSuccess).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.revokeOldest).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedCredential.isLocked).toHaveBeenCalledTimes(1)
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledTimes(1)

      expect(mockedTokenHasher.hash).toHaveBeenNthCalledWith(1, 'normalized-ip')
      expect(mockedUserRepository.findByEmailWithCredentials).toHaveBeenCalledWith('test@example.com')
      expect(mockedPasswordHasher.compare).toHaveBeenCalledWith('secret', validPasswordHash.toString())
      expect(mockedIpValidator.isValid).toHaveBeenCalledWith('203.0.113.10')
      expect(mockedIpValidator.isPublic).toHaveBeenCalledWith('203.0.113.10')
      expect(mockedIpValidator.normalize).toHaveBeenCalledWith('203.0.113.10')
      expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledWith('normalized-ip')
      expect(mockedTokenGenerator.generateSessionToken).toHaveBeenCalledWith(
        validUserId.toString(),
        expectedSessionId.toString(),
        new Date(now.getTime() + sessionTtlMilliseconds),
      )
      expect(mockedTokenGenerator.generateAccessToken).toHaveBeenCalledWith(
        validUserId.toString(),
        expectedSessionId.toString(),
        new Date(now.getTime() + accessTtlMilliseconds),
      )
      expect(mockedTokenHasher.hash).toHaveBeenNthCalledWith(2, 'refresh-clear')
      expect(mockedSessionsRepository.existsDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: now,
          deviceCity: 'Madrid',
          deviceCountry: 'ES',
          deviceTimezone: 'Europe/Madrid',
          expiresAt: new Date(now.getTime() + sessionTtlMilliseconds),
          id: expectedSessionId,
          ipHash: validIpHash,
          revokedAt: null,
          tokenHash: validHashToken,
          updatedAt: now,
          userAgent: expectedUA,
          userId: validUserId,
        }),
      )
      expect(mockedCredentialsRepository.saveLoginSuccess).toHaveBeenCalledWith(mockedCredential, fakeContext)
      expect(mockedSessionsRepository.revokeOldest).toHaveBeenCalledWith(
        validUserId.toString(),
        mockedMaxSessionPolicy.maxSessions,
        fakeContext,
      )
      expect(mockedSessionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: now,
          deviceCity: 'Madrid',
          deviceCountry: 'ES',
          deviceTimezone: 'Europe/Madrid',
          expiresAt: new Date(now.getTime() + sessionTtlMilliseconds),
          id: expectedSessionId,
          ipHash: validIpHash,
          revokedAt: null,
          tokenHash: validHashToken,
          updatedAt: now,
          userAgent: expectedUA,
          userId: validUserId,
        }),
        fakeContext,
      )
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: DomainEventAggregateId.fromString(validUserId.toString()),
          aggregateType: DomainEventAggregateType.user(),
          id: expectedDomainEventId,
          name: DomainEventName.successfulLogin(),
          occurredAt: now,
          payload: {
            userId: validUserId.toString(),
            sessionId: expectedSessionId.toString(),
            isNewDevice: false,
            country: 'ES',
            city: 'Madrid',
            timezone: 'Europe/Madrid',
          },
          metadata: {
            ipHash: validIpHash.toString(),
            ua: expectedUA.toString(),
          },
        }),
        fakeContext,
      )
      expect(mockedCredential.isLocked).toHaveBeenCalledWith(now)
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledWith(now)
    })

    it('calls services and entities correctly when device location resolver fails', async () => {
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
        }),
      )
    })

    it('calls services and entities correctly when device location resolver fails without an error', async () => {
      mockedIpValidator.isValid.mockReturnValueOnce(true)
      mockedIpValidator.isPublic.mockReturnValueOnce(true)
      mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')
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
        }),
      )
    })

    it('calls services and entities when user-agent is not valid', async () => {
      const inputWithInvalidUA = {
        ...input,
        userAgent: 'a'.repeat(513),
      }

      mockedDeviceLocationResolver.resolve.mockResolvedValue({ country: 'ES', city: 'Madrid', timezone: 'Europe/Madrid' })
      mockedIpValidator.isValid.mockReturnValueOnce(true)
      mockedIpValidator.isPublic.mockReturnValueOnce(true)
      mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip').mockReturnValueOnce('normalized-ip')

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
      expect(mockedSessionsRepository.existsDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedSessionId,
          userAgent: expectedUnknownUA,
        }),
      )
      expect(mockedSessionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedSessionId,
          userAgent: expectedUnknownUA,
        }),
        fakeContext,
      )
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedDomainEventId,
          metadata: {
            ipHash: validIpHash.toString(),
            ua: expectedUnknownUA.toString(),
          },
        }),
        fakeContext,
      )
    })

    it('returns the correct response', async () => {
      mockedDeviceLocationResolver.resolve.mockResolvedValue({ country: 'ES', city: 'Madrid', timezone: 'Europe/Madrid' })

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
          accessTokenExpiresAt: new Date(now.getTime() + accessTtlMilliseconds),
          sessionId: expectedSessionId.toString(),
          refreshTokenExpiresAt: new Date(now.getTime() + sessionTtlMilliseconds),
          isNewDevice: false,
        },
      })
    })
  })

  describe('when there are errors', () => {
    let baseInput: LoginUserApplicationRequestDto

    beforeEach(() => {
      jest.resetAllMocks()
      mockedClock.now.mockReturnValue(now)
      mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => work(fakeContext))

      baseInput = {
        email: 'john@example.com',
        password: 'secret',
        ip: '203.0.113.10',
        userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
      }
    })

    it('should return error when email is not valid', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...baseInput, email: 'not-an-email' })

      expect(result).toMatchObject({
        success: false,
        error: LoginUserApplicationError.invalidUserEmail('not-an-email'),
      })
      expect(mockedUserRepository.findByEmailWithCredentials).not.toHaveBeenCalled()
    })

    describe('when user does not exist, does not have credentials or is locked', () => {
      const checkFlowHasStoppedCorrectly = () => {
        expect(mockedIpValidator.isValid).not.toHaveBeenCalled()
        expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
        expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
        expect(mockedTokenHasher.hash).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
      }

      it('should return error when user does not exist', async () => {
        mockedTokenHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())
        mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(null)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userNotFound('john@example.com'),
        })

        checkFlowHasStoppedCorrectly()
      })

      it('should return error if user is removed or deactivated', async () => {
        mockedTokenHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())

        const userDeleted = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.deactivated())
          .withCredential(Relationship.missing())
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(userDeleted)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userNotFound('john@example.com'),
        })

        checkFlowHasStoppedCorrectly()
      })

      it('should return error if user does not have a credential', async () => {
        mockedTokenHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())

        const userNoCredentials = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.active())
          .withCredential(Relationship.missing())
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(userNoCredentials)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials(userNoCredentials.id.toString()),
        })

        checkFlowHasStoppedCorrectly()
      })

      it('should return error if user credential is locked', async () => {
        mockedTokenHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())

        const mockedCredential = mock<UserCredential>()
        mockedCredential.isLocked.mockReturnValue(true)

        const userWithCredentialsLocked = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.active())
          .withCredential(Relationship.loaded(mockedCredential))
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(userWithCredentialsLocked)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.userLockedLogin(userWithCredentialsLocked.id.toString()),
        })

        checkFlowHasStoppedCorrectly()
      })
    })

    describe('when password does not match', () => {
      beforeEach(() => {
        const ipHash = UserSessionIpHashMother.valid().toString()
        mockedTokenHasher.hash.mockResolvedValueOnce(ipHash)

        mockedCredential.isLocked.mockReturnValue(false)

        const user = new UserTestBuilder()
          .withId(validUserId)
          .withEmail(validEmail)
          .withStatus(UserStatus.active())
          .withCredential(Relationship.loaded(mockedCredential))
          .withDeletedAt(null)
          .build()

        mockedUserRepository.findByEmailWithCredentials.mockResolvedValueOnce(user)
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
          country: null,
          city: null,
          timezone: null,
        },
        metadata: {
          ipHash: validIpHash.toString(),
          ua: expectedUA.toString(),
        },
      }

      it('should return error when lock must not be applied', async () => {
        mockedIpValidator.isValid.mockReturnValueOnce(true)
        mockedDeviceLocationResolver.resolve.mockResolvedValueOnce(null)
        mockedLockoutPolicy.evaluateLock.mockReturnValueOnce(null)

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(validUserId.toString()),
        })

        expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
        expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
        expect(mockedLockoutPolicy.evaluateLock).toHaveBeenCalledTimes(1)
        expect(mockedCredentialsRepository.saveFailedAttempts).toHaveBeenCalledTimes(1)
        expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(1)
        expect(mockedCredential.lock).not.toHaveBeenCalled()
        expect(mockedCredentialsRepository.saveLock).not.toHaveBeenCalled()

        expect(mockedLockoutPolicy.evaluateLock).toHaveBeenCalledWith(mockedCredential)
        expect(mockedCredential.incrementFailedAttempts).toHaveBeenCalledWith(now)
        expect(mockedCredentialsRepository.saveFailedAttempts).toHaveBeenCalledWith(mockedCredential, fakeContext)
        expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(expect.objectContaining(expectedDomainEvent), fakeContext)
      })

      it('should return error and save lock when a lock must be applied', async () => {
        mockedIpValidator.isValid.mockReturnValueOnce(true)
        mockedLockoutPolicy.evaluateLock.mockReturnValueOnce(new Date(now.getTime() + 500))

        const result = await buildUseCase().execute(baseInput)

        expect(result).toMatchObject({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(validUserId.toString()),
        })

        expect(mockedCredential.lock).toHaveBeenCalledTimes(1)
        expect(mockedCredentialsRepository.saveLock).toHaveBeenCalledTimes(1)

        expect(mockedCredential.lock).toHaveBeenCalledWith(new Date(now.getTime() + 500), now)
        expect(mockedCredentialsRepository.saveLock).toHaveBeenCalledWith(mockedCredential, fakeContext)
      })

      it('should return error and create the correct domain event when session hash ip is NULL', async () => {
        mockedIpValidator.isValid.mockReturnValueOnce(false)
        mockedLockoutPolicy.evaluateLock.mockReturnValueOnce(null)

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

    it('should throw error if an unexpected error occurs', async () => {
      mockedTokenHasher.hash.mockResolvedValueOnce(UserSessionIpHashMother.valid().toString())
      mockedUserRepository.findByEmailWithCredentials.mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      const useCase = buildUseCase()

      await expect(() => useCase.execute(baseInput)).rejects.toThrow(Error('Unexpected Error'))
    })
  })
})
