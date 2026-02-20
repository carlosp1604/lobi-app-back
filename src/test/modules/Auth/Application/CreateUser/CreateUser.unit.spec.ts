/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { ProfileRepositoryInterface } from '~/src/modules/User/Domain/Profile/ProfileRepositoryInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { SportsmanProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/SportsmanProfileTestBuilder'
import { OwnerProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/OwnerProfileTestBuilder'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'

describe('CreateUser', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialRepository = mock<UserCredentialRepositoryInterface>()
  const mockedProfileRepository = mock<ProfileRepositoryInterface>()
  const mockedVerificationTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()

  const now = new Date('2026-02-16T20:43:00.000Z')
  const pastDate = new Date(now.getTime() - 3600 * 1000)
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validEmail = UserEmailMother.valid()
  const validUsername = UserUsernameMother.valid()
  const validName = UserNameMother.valid()
  const validPassword = UserPasswordMother.valid()
  const validTokenValue = VerificationTokenValueMother.valid()
  const validSportsmanRole = UserRoleMother.sportsman()
  const validOwnerRole = UserRoleMother.owner()

  const validUserId = UserIdMother.valid()
  const validSportsmanProfileId = UserProfileIdMother.valid()
  const validOwnerProfileId = UserProfileIdMother.valid()
  const expectedDomainEventId = DomainEventIdMother.valid()

  const validPasswordHash = PasswordHashMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  let baseRequest: CreateUserApplicationRequestDto
  let verificationTokenBuilder: VerificationTokenTestBuilder
  let requestOriginData: RequestOriginData

  const buildUseCase = () => {
    return new CreateUser(
      mockedUserRepository,
      mockedCredentialRepository,
      mockedProfileRepository,
      mockedVerificationTokenRepository,
      mockedDomainEventRepository,
      mockedVerifyTokenService,
      mockedHasherService,
      mockedRequestOriginService,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGenerator,
    )
  }

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedUserRepository)
    mockReset(mockedCredentialRepository)
    mockReset(mockedProfileRepository)
    mockReset(mockedVerificationTokenRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedVerifyTokenService)
    mockReset(mockedHasherService)
    mockReset(mockedRequestOriginService)
    mockReset(mockedClock)
    mockReset(mockedLogger)
    mockReset(mockedUnitOfWork)
    mockReset(mockedIdGenerator)

    baseRequest = {
      email: validEmail.value,
      username: validUsername.value,
      name: validName.value,
      password: validPassword.value,
      token: validTokenValue.value,
      requestedRole: validSportsmanRole.value,
      ip: '8.8.8.8',
      userAgent: validUA.value,
    }

    verificationTokenBuilder = new VerificationTokenTestBuilder()
      .withEmail(VerificationTokenEmail.fromString(validEmail.value))
      .withPurpose(VerificationTokenPurpose.createAccount())
      .withExpiresAt(futureDate)
      .withUsedAt(null)

    requestOriginData = {
      userAgent: validUA,
      ipHash: validIpHash.value,
      normalizedIp: 'normalized-ip',
      deviceLocation: validDeviceLocation,
    }

    mockedClock.now.mockReturnValue(now)
    mockedRequestOriginService.process.mockResolvedValue(requestOriginData)
    mockedHasherService.hash.mockResolvedValue(validPasswordHash.value)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    const expectedVerificationToken = verificationTokenBuilder.build()
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expectedVerificationToken)
    mockedVerifyTokenService.verify.mockResolvedValue(true)
    mockedUserRepository.checkEmailExists.mockResolvedValue(false)
    mockedUserRepository.checkUsernameExists.mockResolvedValue(false)

    mockedIdGenerator.generateId
      .mockReturnValueOnce(validUserId.value)
      .mockReturnValueOnce(validSportsmanProfileId.value)
      .mockReturnValueOnce(expectedDomainEventId.value)
  })

  describe('happy path', () => {
    const buildExpectedUser = (expectedRole: UserRole) => {
      return new UserTestBuilder()
        .withId(validUserId)
        .withEmail(validEmail)
        .withName(validName)
        .withUsername(validUsername)
        .withRoleUser(expectedRole)
        .withUploadId(null)
        .withCreatedAt(now)
        .withDeletedAt(null)
        .withUpdatedAt(now)
        .withEmailVerifiedAt(now)
        .withStatus(UserStatus.active())
        .build()
    }

    const buildExpectedUserCredential = () => {
      return new UserCredentialTestBuilder()
        .withUserId(validUserId)
        .withPasswordHash(validPasswordHash)
        .withFailedAttempts(0)
        .withLockedUntil(null)
        .withLastLoginAt(null)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build()
    }

    const buildExpectedSportsmanProfile = () => {
      return new SportsmanProfileTestBuilder()
        .withId(validSportsmanProfileId)
        .withUserId(validUserId)
        .withBio(null)
        .withBirthDate(null)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build()
    }

    const buildExpectedOwnerProfile = () => {
      return new OwnerProfileTestBuilder()
        .withId(validOwnerProfileId)
        .withUserId(validUserId)
        .withCompanyName(null)
        .withContactPhone(null)
        .withTaxId(null)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build()
    }

    const buildExpectedDomainEvent = (deviceLocation: DeviceLocation | null) => {
      return new DomainEventTestBuilder()
        .withId(expectedDomainEventId)
        .withName(DomainEventName.successfulSignup())
        .withAggregateType(DomainEventAggregateType.user())
        .withAggregateId(DomainEventAggregateId.fromString(validUserId.value))
        .withOccurredAt(now)
        .withMetadata({
          ipHash: validIpHash.value,
          ua: validUA.value,
        })
        .withPayload({
          userId: validUserId.value,
          email: validEmail.value,
          deviceLocation: deviceLocation
            ? {
                city: deviceLocation.city,
                countryCode: deviceLocation.countryCode,
              }
            : null,
        })
        .build()
    }

    const assertCommonCallsAndResult = (
      result: Result<void, CreateUserApplicationError>,
      expectedRole: UserRole,
      idGeneratorExpectedCalls: number,
      expectedDeviceLocation: DeviceLocation | null,
    ) => {
      const expectedUser = buildExpectedUser(expectedRole)
      const expectedUserCredential = buildExpectedUserCredential()
      const expectedDomainEvent = buildExpectedDomainEvent(expectedDeviceLocation)
      const expectedSportsmanProfile = buildExpectedSportsmanProfile()
      const expectedInitialVerificationToken = verificationTokenBuilder.build()
      const usedVerificationToken = verificationTokenBuilder.withUsedAt(now).build()

      expect(expectedInitialVerificationToken.usedAt).toBeNull()
      expect(mockedRequestOriginService.process).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.checkUsernameExists).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.checkEmailExists).toHaveBeenCalledTimes(1)
      expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(idGeneratorExpectedCalls)
      expect(mockedUserRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedProfileRepository.saveSportsmanProfile).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(result).toStrictEqual({ success: true, value: undefined })

      expect(mockedRequestOriginService.process).toHaveBeenCalledWith(baseRequest.ip, baseRequest.userAgent, {
        email: validEmail.value,
      })
      expect(mockedHasherService.hash).toHaveBeenCalledWith(baseRequest.password)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledWith(validEmail.value, fakeContext)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedInitialVerificationToken.id,
        }),
        validTokenValue.value,
      )
      expect(mockedUserRepository.checkEmailExists).toHaveBeenCalledWith(expect.anything(), fakeContext)
      expect(mockedUserRepository.checkUsernameExists).toHaveBeenCalledWith(expect.anything(), fakeContext)
      expect(mockedUserRepository.save).toHaveBeenCalledWith(expectedUser, fakeContext)
      expect(mockedCredentialRepository.save).toHaveBeenCalledWith(expectedUserCredential, fakeContext)
      expect(mockedProfileRepository.saveSportsmanProfile).toHaveBeenCalledWith(expectedSportsmanProfile, fakeContext)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledWith(usedVerificationToken, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(expectedDomainEvent, fakeContext)
    }

    it('should call services, repositories and entities correctly and return the correct result when requested role is sportsman', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute(baseRequest)

      assertCommonCallsAndResult(result, validSportsmanRole, 3, requestOriginData.deviceLocation)
      expect(mockedProfileRepository.saveOwnerProfile).not.toHaveBeenCalled()
    })

    it('should call services, repositories and entities correctly and return the correct result when requested role is owner', async () => {
      mockedRequestOriginService.process.mockResolvedValue({
        ...requestOriginData,
        deviceLocation: null,
      })
      mockedIdGenerator.generateId.mockReset()
      mockedIdGenerator.generateId
        .mockReturnValueOnce(validUserId.value)
        .mockReturnValueOnce(validSportsmanProfileId.value)
        .mockReturnValueOnce(validOwnerProfileId.value)
        .mockReturnValueOnce(expectedDomainEventId.value)

      baseRequest = { ...baseRequest, requestedRole: validOwnerRole.value }

      const useCase = buildUseCase()
      const result = await useCase.execute(baseRequest)

      const expectedOwnerProfile = buildExpectedOwnerProfile()

      assertCommonCallsAndResult(result, validOwnerRole, 4, null)
      expect(mockedProfileRepository.saveOwnerProfile).toHaveBeenCalledTimes(1)
      expect(mockedProfileRepository.saveOwnerProfile).toHaveBeenCalledWith(expectedOwnerProfile, fakeContext)
    })
  })

  describe('when there are errors', () => {
    describe('when input data is not valid', () => {
      it('should return error when email is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, email: VerificationTokenEmailMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidEmail()]),
        })
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should return error when token format is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, token: VerificationTokenValueMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidTokenFormat()]),
        })
      })

      it('should return error when username is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, username: UserUsernameMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidUsername()]),
        })
      })

      it('should return error when name is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, name: UserNameMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidName()]),
        })
      })

      it('should return error when password is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, password: UserPasswordMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidPassword()]),
        })
      })

      it('should return error when user role is invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({ ...baseRequest, requestedRole: UserRoleMother.invalid() })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidRole()]),
        })
      })

      it('should return multiple errors if multiple inputs are invalid', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({
          ...baseRequest,
          email: UserEmailMother.invalid(),
          password: UserPasswordMother.invalid(),
        })

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidInput([CreateUserError.invalidEmail(), CreateUserError.invalidPassword()]),
        })
      })
    })

    describe('when token is not valid (not found, expired, used, incorrect code, incorrect user, incorrect purpose)', () => {
      it('should return notFound error when token does not exist', async () => {
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.notFound(CreateUserError.tokenNotFound(validEmail.value)),
        })
      })

      it('should return tokenExpired error when token is already expired', async () => {
        const expiredVerificationToken = verificationTokenBuilder.withExpiresAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expiredVerificationToken)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidToken(CreateUserError.tokenExpired()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed: tokenExpired', {
          message: VerificationTokenDomainException.alreadyExpired(expiredVerificationToken.id.value).message,
          verificationTokenId: expiredVerificationToken.id.value,
          email: validEmail.value,
          expiresAt: expiredVerificationToken.expiresAt,
        })
      })

      it('should return tokenAlreadyUsed error when token is already used', async () => {
        const usedVerificationToken = verificationTokenBuilder.withUsedAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(usedVerificationToken)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidToken(CreateUserError.tokenAlreadyUsed()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed: tokenAlreadyUsed', {
          message: VerificationTokenDomainException.alreadyUsed(usedVerificationToken.id.value).message,
          verificationTokenId: usedVerificationToken.id.value,
          email: validEmail.value,
          usedAt: usedVerificationToken.usedAt,
        })
      })

      it('should return tokenInvalidOwner when token does not belong to user', async () => {
        const verificationToken = verificationTokenBuilder.build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const domainException = VerificationTokenDomainException.cannotBeUsedByUser(verificationToken.id.value, validEmail.value)
        jest.spyOn(verificationToken, 'validate').mockReturnValue({
          success: false,
          error: domainException,
        })

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed: tokenInvalidOwner', {
          message: domainException.message,
          verificationTokenId: verificationToken.id.value,
          email: validEmail.value,
          ownerEmail: verificationToken.email.value,
        })
      })

      it('should return tokenPurposeMismatch when token cannot be used for the current operation', async () => {
        const notAccountCreateVerificationToken = verificationTokenBuilder.withPurpose(VerificationTokenPurpose.resetPassword()).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(notAccountCreateVerificationToken)
        const domainException = VerificationTokenDomainException.cannotBeUsedForPurpose(
          notAccountCreateVerificationToken.id.value,
          VerificationTokenPurpose.createAccount().value,
        )

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed: tokenPurposeMismatch', {
          message: domainException.message,
          verificationTokenId: notAccountCreateVerificationToken.id.value,
          email: validEmail.value,
          verificationTokenPurpose: notAccountCreateVerificationToken.purpose.value,
        })
      })

      it('should return invalidToken error when cryptographic verification fails', async () => {
        mockedVerifyTokenService.verify.mockResolvedValue(false)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token cryptography verification failed', {
          email: validEmail.value,
        })
      })

      it('should re-throw exception when entity returns a unexpected VerificationTokenDomainException', async () => {
        const verificationToken = verificationTokenBuilder.build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const unhandledDomainError = VerificationTokenDomainException.invalidTokenHash()
        jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
          throw unhandledDomainError
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(baseRequest)).rejects.toThrow(unhandledDomainError)
      })
    })

    describe('when data is duplicated', () => {
      const assertLoggerCall = (emailExists: boolean, usernameExists: boolean) => {
        expect(mockedLogger.warn).toHaveBeenCalledWith('Signup attempt with existing credentials', {
          username: validUsername.value,
          email: validEmail.value,
          emailExists,
          usernameExists,
        })
      }

      it('should return error when email is duplicated', async () => {
        mockedUserRepository.checkEmailExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.duplicated([CreateUserError.duplicatedEmail(validEmail.value)]),
        })
        assertLoggerCall(true, false)
        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })

      it('should return error when username is duplicated', async () => {
        mockedUserRepository.checkUsernameExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.duplicated([CreateUserError.duplicatedUsername(validUsername.value)]),
        })
        assertLoggerCall(false, true)
        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })

      it('should return multiple duplicated errors when both exist', async () => {
        mockedUserRepository.checkEmailExists.mockResolvedValue(true)
        mockedUserRepository.checkUsernameExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: CreateUserApplicationError.duplicated([
            CreateUserError.duplicatedEmail(validEmail.value),
            CreateUserError.duplicatedUsername(validUsername.value),
          ]),
        })
        assertLoggerCall(true, true)
        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('when infrastructure fails', () => {
      it('should throw error when RequestOriginApplicationService fails', async () => {
        const requestOriginError = new Error('Unexpected RequestOriginApplicationService error')

        mockedRequestOriginService.process.mockImplementation(() => {
          throw requestOriginError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(requestOriginError)
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should throw error when PasswordHasher fails', async () => {
        const hashingError = new Error('Unexpected hashing failed')
        mockedHasherService.hash.mockImplementation(() => {
          throw hashingError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(hashingError)
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should throw error when UserRepository fails during save', async () => {
        const dbError = new Error('Unexpected DB error')

        mockedUserRepository.save.mockImplementation(() => {
          throw dbError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(dbError)
      })
    })
  })
})
