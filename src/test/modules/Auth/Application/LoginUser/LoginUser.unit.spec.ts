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
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

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
  const mockedDomainEventFactory = mock<AuthDomainEventFactory>()

  const activeSession1 = mock<UserSession>({ id: IdentifierMother.valid() })
  const activeSession2 = mock<UserSession>()
  const activeSession3 = mock<UserSession>()

  const now = new Date('2025-01-02T03:04:05.000Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const expectedAccessExpiresAt = new Date(now.getTime() + 1000)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 3600)

  const validEmail = EmailAddressMother.valid()
  const validUserId = IdentifierMother.valid()
  const validPasswordHash = PasswordHashMother.valid()
  const validUserIpHash = UserIpHashMother.valid()
  const validDeviceInfo = DeviceInfoMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  const expectedSessionId = IdentifierMother.valid()
  const mockedCredential = mock<UserCredential>({ passwordHash: validPasswordHash })

  let successfulLoginEvent: DomainEvent
  let failedLoginAttemptEvent: DomainEvent

  let request: LoginUserApplicationRequestDto

  let userTestBuilder: UserTestBuilder
  let userSessionTestBuilder: UserSessionTestBuilder

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
    mockReset(mockedDomainEventFactory)
    mockReset(activeSession3)
    mockReset(activeSession2)
    mockReset(activeSession1)

    userSessionTestBuilder = new UserSessionTestBuilder()
      .withIpHash(validUserIpHash)
      .withDeviceInfo(validDeviceInfo)
      .withUserId(validUserId)
      .withId(expectedSessionId)
      .withDeviceLocation(validDeviceLocation)

    userTestBuilder = new UserTestBuilder()
      .withId(validUserId)
      .withEmail(validEmail)
      .withStatus(UserStatus.active())
      .withDeletedAt(null)

    const expectedSession = userSessionTestBuilder.build()
    const expectedUser = userTestBuilder.build()

    mockedClock.now.mockReturnValue(now)
    mockedUserRepository.findByEmailWithLock.mockResolvedValue(expectedUser)
    mockedCredentialsRepository.findByUserId.mockResolvedValue(mockedCredential)
    mockedHasherService.compare.mockResolvedValue(true)
    mockedGenerateTokensService.generate.mockResolvedValue(buildGenerateTokensResponse(expectedSession))
    mockedSessionsRepository.findUserActiveSessions.mockResolvedValue([activeSession1, activeSession2, activeSession3])
    mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [] })
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    successfulLoginEvent = new DomainEventTestBuilder().build()
    failedLoginAttemptEvent = new DomainEventTestBuilder().build()

    mockedDomainEventFactory.createSuccessfulLoginEvent.mockReturnValue(successfulLoginEvent)
    mockedDomainEventFactory.createFailedAttemptEvent.mockReturnValue(failedLoginAttemptEvent)

    request = {
      email: validEmail.value,
      password: UserPasswordMother.random().value,
      clientMetadata: new ClientMetadataResponseTestBuilder()
        .withDeviceInfo(validDeviceInfo)
        .withDeviceLocation(validDeviceLocation)
        .withUserIpHash(validUserIpHash)
        .build(),
    }
  })

  describe('happy path', () => {
    const checkCommonCalls = (
      expectedSession: UserSession,
      ipHash: UserIpHash | null,
      deviceLocation: DeviceLocation | null,
      sessionsToRevoke: Array<UserSession>,
    ) => {
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.compare).toHaveBeenCalledTimes(1)
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createSuccessfulLoginEvent).toHaveBeenCalledTimes(1)
      expect(mockedSessionsRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith(validEmail.value, fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedHasherService.compare).toHaveBeenCalledWith(request.password, validPasswordHash.value)
      expect(mockedGenerateTokensService.generate).toHaveBeenCalledWith(validUserId, now, validDeviceInfo, ipHash, deviceLocation)
      expect(mockedSessionsRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId, now, fakeContext)
      expect(mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin).toHaveBeenCalledWith(
        [activeSession1, activeSession2, activeSession3],
        now,
      )
      expect(mockedDomainEventFactory.createSuccessfulLoginEvent).toHaveBeenCalledWith(expectedSession, now)
      expect(mockedSessionsRepository.save).toHaveBeenCalledWith([...sessionsToRevoke, expectedSession], fakeContext)
      expect(mockedCredentialsRepository.update).toHaveBeenCalledWith(mockedCredential, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(successfulLoginEvent, fakeContext)
      expect(mockedCredential.resetAfterSuccessfulLogin).toHaveBeenCalledWith(now)
    }

    const checkResult = (result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>) => {
      expect(result.success).toBe(true)
      expect(result).toEqual({
        success: true,
        value: {
          refreshToken: 'refresh-clear-token',
          accessToken: 'access-jwt-token',
          accessTokenExpiresAt: expectedAccessExpiresAt,
          sessionId: expectedSessionId.value,
          refreshTokenExpiresAt: expectedRefreshExpiresAt,
        },
      })
    }

    it('should call services and entities correctly and return the correct result when sessions must be revoked', async () => {
      const expectedSession = userSessionTestBuilder.build()
      const sessionsToRevoke = [activeSession1]

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: sessionsToRevoke })

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      checkCommonCalls(expectedSession, validUserIpHash, validDeviceLocation, sessionsToRevoke)
      checkResult(result)
    })

    it('should call services and entities correctly and return the correct result when no sessions must be revoked', async () => {
      const requestWithNullishIpAndLocation = {
        ...request,
        clientMetadata: new ClientMetadataResponseTestBuilder().withUserIpHash(null).withDeviceLocation(null).build(),
      }

      const expectedSession = userSessionTestBuilder.withIpHash(null).withDeviceLocation(null).build()
      mockedGenerateTokensService.generate.mockResolvedValue(buildGenerateTokensResponse(expectedSession))

      mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockReturnValue({ success: true, value: [] })

      const useCase = buildUseCase()

      const result = await useCase.execute(requestWithNullishIpAndLocation)

      checkCommonCalls(expectedSession, null, null, [])
      checkResult(result)
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const invalidEmail = EmailAddressMother.invalid()
      const expectedDomainErrorMessage = SharedDomainException.invalidEmailAddress(invalidEmail).message

      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, email: invalidEmail })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidUserEmail(expectedDomainErrorMessage))

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when password format is not valid', async () => {
      const invalidPassword = UserPasswordMother.invalid()
      const useCase = buildUseCase()
      const result = await useCase.execute({ ...request, password: invalidPassword })

      const invalidPasswordMessage = UserCredentialDomainException.invalidPasswordFormat().message

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidPasswordFormat(invalidPasswordMessage))

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    describe('when user does not exist, is deleted or is not active', () => {
      const runTestCaseAndAssertResult = async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userNotFound())

        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()
      }

      it('should return error when user does not exist', async () => {
        mockedUserRepository.findByEmailWithLock.mockResolvedValue(null)

        await runTestCaseAndAssertResult()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login rejected', {
          email: validEmail.value,
          reason: 'User not found',
        })
      })

      it('should return error when user is disabled', async () => {
        const deletedUser = userTestBuilder.withStatus(UserStatus.deactivated()).withDeletedAt(now).build()

        mockedUserRepository.findByEmailWithLock.mockResolvedValueOnce(deletedUser)

        const useCase = buildUseCase()

        const result = await useCase.execute(request)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userDisabled())

        expect(mockedCredentialsRepository.findByUserId).not.toHaveBeenCalled()

        expect(mockedLogger.warn).toHaveBeenCalledWith('Login rejected', {
          email: validEmail.value,
          reason: 'User is disabled',
        })
      })
    })

    it('should return error when user does not have credentials', async () => {
      mockedCredentialsRepository.findByUserId.mockResolvedValue(null)

      const useCase = buildUseCase()

      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.userDoesNotHaveCredentials())

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
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidCredentials())

      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.compare).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createFailedAttemptEvent).toHaveBeenCalledTimes(1)

      expect(mockedUserRepository.findByEmailWithLock).toHaveBeenCalledWith(validEmail.value, fakeContext)
      expect(mockedCredentialsRepository.findByUserId).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedHasherService.compare).toHaveBeenCalledWith(request.password, validPasswordHash.value)
      expect(mockedDomainEventFactory.createFailedAttemptEvent).toHaveBeenCalledWith(
        validUserId,
        validDeviceLocation,
        validDeviceInfo,
        validUserIpHash,
        now,
      )
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(failedLoginAttemptEvent, fakeContext)

      expect(mockedGenerateTokensService.generate).not.toHaveBeenCalled()
    })

    describe('when session cannot be revoked', () => {
      it('should return error when userSessionPolicyManager returns revocationFailed error', async () => {
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

      it('should return error when UserSessionPolicyManagerApplicationService returns an unknown error', async () => {
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

      it('should throw error when UserSessionPolicyManagerApplicationService fails', async () => {
        mockedUserSessionPolicyManagerService.applyPolicyAndRevokeForLogin.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(Error('Unexpected error'))
        expect(mockedDomainEventFactory.createSuccessfulLoginEvent).not.toHaveBeenCalled()
      })
    })

    it('should throw error when UserRepository fails during findByEmailWithLock', async () => {
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
