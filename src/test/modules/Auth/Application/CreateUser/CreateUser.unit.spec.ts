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
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { SportsmanProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/SportsmanProfileTestBuilder'
import { OwnerProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/OwnerProfileTestBuilder'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

describe('CreateUser', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialRepository = mock<UserCredentialRepositoryInterface>()
  const mockedProfileRepository = mock<ProfileRepositoryInterface>()
  const mockedVerificationTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedDomainEventFactory = mock<AuthDomainEventFactory>()

  const now = new Date('2026-02-16T20:43:00.000Z')
  const pastDate = new Date(now.getTime() - 3600 * 1000)
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validEmail = EmailAddressMother.valid()
  const validUsername = UserUsernameMother.valid()
  const validName = UserNameMother.valid()
  const validPassword = UserPasswordMother.valid()
  const validTokenValue = VerificationTokenValueMother.valid()
  const validSportsmanRole = UserRoleMother.sportsman()
  const validOwnerRole = UserRoleMother.owner()

  const validUserId = IdentifierMother.valid()
  const validSportsmanProfileId = IdentifierMother.valid()
  const validOwnerProfileId = IdentifierMother.valid()

  const validPasswordHash = PasswordHashMother.valid()

  let baseRequest: CreateUserApplicationRequestDto
  let verificationTokenBuilder: VerificationTokenTestBuilder
  let successfulSignupEvent: DomainEvent

  const buildUseCase = () => {
    return new CreateUser(
      mockedUserRepository,
      mockedCredentialRepository,
      mockedProfileRepository,
      mockedVerificationTokenRepository,
      mockedDomainEventRepository,
      mockedVerifyTokenService,
      mockedHasherService,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGenerator,
      mockedDomainEventFactory,
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
    mockReset(mockedClock)
    mockReset(mockedLogger)
    mockReset(mockedUnitOfWork)
    mockReset(mockedIdGenerator)
    mockReset(mockedDomainEventFactory)

    successfulSignupEvent = new DomainEventTestBuilder().build()

    baseRequest = {
      email: validEmail.value,
      username: validUsername.value,
      name: validName.value,
      password: validPassword.value,
      token: validTokenValue.value,
      requestedRole: validSportsmanRole.value,
      clientMetadata: new ClientMetadataResponseTestBuilder().build(),
    }

    verificationTokenBuilder = new VerificationTokenTestBuilder()
      .withEmail(validEmail)
      .withPurpose(VerificationTokenPurpose.createAccount())
      .withExpiresAt(futureDate)
      .withUsedAt(null)

    mockedClock.now.mockReturnValue(now)
    mockedHasherService.hash.mockResolvedValue(validPasswordHash.value)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    const expectedVerificationToken = verificationTokenBuilder.build()
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expectedVerificationToken)
    mockedVerifyTokenService.verify.mockResolvedValue(true)
    mockedUserRepository.checkEmailExists.mockResolvedValue(false)
    mockedUserRepository.checkUsernameExists.mockResolvedValue(false)
    mockedDomainEventFactory.createSuccessfulSignupEvent.mockReturnValue(successfulSignupEvent)

    mockedIdGenerator.generateId.mockReturnValueOnce(validUserId.value).mockReturnValueOnce(validSportsmanProfileId.value)
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

    const assertCommonCallsAndResult = (
      request: CreateUserApplicationRequestDto,
      result: Result<void, CreateUserApplicationError>,
      expectedRole: UserRole,
      idGeneratorExpectedCalls: number,
    ) => {
      const expectedUser = buildExpectedUser(expectedRole)
      const expectedUserCredential = buildExpectedUserCredential()
      const expectedSportsmanProfile = buildExpectedSportsmanProfile()
      const expectedInitialVerificationToken = verificationTokenBuilder.build()
      const usedVerificationToken = verificationTokenBuilder.withUsedAt(now).build()

      expect(expectedInitialVerificationToken.usedAt).toBeNull()
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.checkUsernameExists).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.checkEmailExists).toHaveBeenCalledTimes(1)
      expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(idGeneratorExpectedCalls)
      expect(mockedDomainEventFactory.createSuccessfulSignupEvent).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedProfileRepository.saveSportsmanProfile).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()

      expect(result).toEqual({ success: true, value: undefined })

      expect(mockedHasherService.hash).toHaveBeenCalledWith(request.password)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledWith(request.email, fakeContext)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedInitialVerificationToken.id,
        }),
        validTokenValue.value,
      )
      expect(mockedUserRepository.checkEmailExists).toHaveBeenCalledWith(validEmail, fakeContext)
      expect(mockedUserRepository.checkUsernameExists).toHaveBeenCalledWith(validUsername, fakeContext)
      expect(mockedDomainEventFactory.createSuccessfulSignupEvent).toHaveBeenCalledWith(
        validUserId,
        validEmail,
        request.clientMetadata.deviceLocation,
        request.clientMetadata.userAgent,
        request.clientMetadata.userIpHash,
        now,
      )
      expect(mockedUserRepository.save).toHaveBeenCalledWith(expectedUser, fakeContext)
      expect(mockedCredentialRepository.save).toHaveBeenCalledWith(expectedUserCredential, fakeContext)
      expect(mockedProfileRepository.saveSportsmanProfile).toHaveBeenCalledWith(expectedSportsmanProfile, fakeContext)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledWith(usedVerificationToken, fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(successfulSignupEvent, fakeContext)
    }

    it('should call services, repositories and entities correctly and return the correct result when requested role is sportsman', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute(baseRequest)

      assertCommonCallsAndResult(baseRequest, result, validSportsmanRole, 2)
      expect(mockedProfileRepository.saveOwnerProfile).not.toHaveBeenCalled()
    })

    it('should call services, repositories and entities correctly and return the correct result when requested role is owner', async () => {
      mockedIdGenerator.generateId.mockReset()
      mockedIdGenerator.generateId
        .mockReturnValueOnce(validUserId.value)
        .mockReturnValueOnce(validSportsmanProfileId.value)
        .mockReturnValueOnce(validOwnerProfileId.value)

      const requestWithOwnerRole = { ...baseRequest, requestedRole: validOwnerRole.value }

      const useCase = buildUseCase()
      const result = await useCase.execute(requestWithOwnerRole)

      const expectedOwnerProfile = buildExpectedOwnerProfile()

      assertCommonCallsAndResult(requestWithOwnerRole, result, validOwnerRole, 3)
      expect(mockedProfileRepository.saveOwnerProfile).toHaveBeenCalledTimes(1)
      expect(mockedProfileRepository.saveOwnerProfile).toHaveBeenCalledWith(expectedOwnerProfile, fakeContext)
    })
  })

  describe('when there are errors', () => {
    describe('when input data is not valid', () => {
      it('should return error when email is invalid', async () => {
        const useCase = buildUseCase()

        const invalidEmail = EmailAddressMother.invalid()
        const expectedDomainErrorMessage = SharedDomainException.invalidEmailAddress(invalidEmail).message

        const result = await useCase.execute({ ...baseRequest, email: invalidEmail })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidEmail(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return error when token format is invalid', async () => {
        const useCase = buildUseCase()

        const invalidTokenFormat = VerificationTokenValueMother.invalid()
        const expectedDomainErrorMessage = VerificationTokenDomainException.invalidVerificationTokenValue().message

        const result = await useCase.execute({ ...baseRequest, token: invalidTokenFormat })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidTokenFormat(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return error when username is invalid', async () => {
        const useCase = buildUseCase()

        const invalidUsername = UserUsernameMother.invalid()
        const expectedDomainErrorMessage = UserDomainException.invalidUsername().message

        const result = await useCase.execute({ ...baseRequest, username: invalidUsername })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidUsername(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return error when name is invalid', async () => {
        const useCase = buildUseCase()

        const invalidUserName = UserNameMother.invalid()
        const expectedDomainErrorMessage = UserDomainException.invalidUserName().message

        const result = await useCase.execute({ ...baseRequest, name: invalidUserName })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidName(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return error when password is invalid', async () => {
        const useCase = buildUseCase()

        const invalidPasswordFormat = UserPasswordMother.invalid()
        const expectedDomainErrorMessage = UserCredentialDomainException.invalidPasswordFormat().message

        const result = await useCase.execute({ ...baseRequest, password: invalidPasswordFormat })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidPassword(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return error when user role is invalid', async () => {
        const useCase = buildUseCase()

        const invalidUserRole = UserRoleMother.invalid()
        const expectedDomainErrorMessage = UserDomainException.invalidUserRole().message

        const result = await useCase.execute({ ...baseRequest, requestedRole: invalidUserRole })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([CreateUserError.invalidRole(expectedDomainErrorMessage)]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return multiple errors if multiple inputs are invalid', async () => {
        const useCase = buildUseCase()

        const invalidEmail = EmailAddressMother.invalid()
        const invalidPassword = UserPasswordMother.invalid()

        const expectedInvalidEmailDomainErrorMessage = SharedDomainException.invalidEmailAddress(invalidEmail).message
        const expectedInvalidPasswordDomainErrorMessage = UserCredentialDomainException.invalidPasswordFormat().message

        const result = await useCase.execute({
          ...baseRequest,
          email: invalidEmail,
          password: invalidPassword,
        })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidInput([
            CreateUserError.invalidEmail(expectedInvalidEmailDomainErrorMessage),
            CreateUserError.invalidPassword(expectedInvalidPasswordDomainErrorMessage),
          ]),
        )
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })
    })

    describe('when token is not valid (not found, expired, used, incorrect code, incorrect user, incorrect purpose)', () => {
      const asserLoggerCall = (
        expectedErrorMessage: string,
        expectedReason: string,
        expectedToken: VerificationToken,
        extraData?: Record<string, unknown>,
      ) => {
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: expectedErrorMessage,
          reason: expectedReason,
          email: expectedToken.email.value,
          expiresAt: expectedToken.expiresAt,
          usedAt: expectedToken.usedAt,
          purpose: expectedToken.purpose.value,
          verificationTokenId: expectedToken.id.value,
          ...(extraData ? extraData : {}),
        })
      }

      it('should return notFound error when token does not exist', async () => {
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(CreateUserApplicationError.notFound(CreateUserError.tokenNotFound()))
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return tokenExpired error when token is already expired', async () => {
        const expiredVerificationToken = verificationTokenBuilder.withExpiresAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expiredVerificationToken)

        const domainException = VerificationTokenDomainException.alreadyExpired()

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidToken(CreateUserError.tokenExpired(domainException.message)),
        )
        asserLoggerCall(domainException.message, 'Token has already expired', expiredVerificationToken)
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return tokenAlreadyUsed error when token is already used', async () => {
        const usedVerificationToken = verificationTokenBuilder.withUsedAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(usedVerificationToken)

        const domainException = VerificationTokenDomainException.alreadyUsed()

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidToken(CreateUserError.tokenAlreadyUsed(domainException.message)),
        )
        asserLoggerCall(domainException.message, 'Token was already used', usedVerificationToken)
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return tokenInvalidOwner when token does not belong to user', async () => {
        const anotherEmail = EmailAddressMother.random()
        const verificationToken = verificationTokenBuilder.withEmail(anotherEmail).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const domainException = VerificationTokenDomainException.cannotBeUsedByUser(validEmail.value)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner(domainException.message)),
        )
        asserLoggerCall(domainException.message, 'Token belongs to a different email address', verificationToken, {
          requestEmail: validEmail.value,
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return tokenPurposeMismatch when token cannot be used for the current operation', async () => {
        const notAccountCreateVerificationToken = verificationTokenBuilder.withPurpose(VerificationTokenPurpose.resetPassword()).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(notAccountCreateVerificationToken)

        const domainException = VerificationTokenDomainException.cannotBeUsedForPurpose()

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch(domainException.message)),
        )
        asserLoggerCall(domainException.message, 'Token was not generated for signup', notAccountCreateVerificationToken)
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken error when cryptographic verification fails', async () => {
        mockedVerifyTokenService.verify.mockResolvedValue(false)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()))
        expect(mockedLogger.warn).toHaveBeenCalledWith('Token cryptography verification failed', {
          email: validEmail.value,
          purpose: VerificationTokenPurpose.createAccount(),
        })
        expect(mockedUserRepository.checkEmailExists).not.toHaveBeenCalled()
      })

      it('should throw exception when entity returns a unexpected VerificationTokenDomainException', async () => {
        const verificationToken = verificationTokenBuilder.build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const unhandledDomainError = VerificationTokenDomainException.invalidVerificationTokenValue()
        jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
          return { success: false, error: unhandledDomainError }
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(baseRequest)).rejects.toThrow(unhandledDomainError)
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })
    })

    describe('when data is duplicated', () => {
      const assertLoggerCall = (emailExists: boolean, usernameExists: boolean) => {
        expect(mockedLogger.warn).toHaveBeenCalledWith('Signup rejected', {
          username: validUsername.value,
          email: validEmail.value,
          reason: 'User is already registered',
          emailExists,
          usernameExists,
        })
      }

      it('should return error when email is duplicated', async () => {
        mockedUserRepository.checkEmailExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(CreateUserApplicationError.duplicated([CreateUserError.duplicatedEmail()]))

        assertLoggerCall(true, false)

        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })

      it('should return error when username is duplicated', async () => {
        mockedUserRepository.checkUsernameExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(CreateUserApplicationError.duplicated([CreateUserError.duplicatedUsername()]))

        assertLoggerCall(false, true)

        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })

      it('should return multiple duplicated errors when both exist', async () => {
        mockedUserRepository.checkEmailExists.mockResolvedValue(true)
        mockedUserRepository.checkUsernameExists.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateUserApplicationError.duplicated([CreateUserError.duplicatedEmail(), CreateUserError.duplicatedUsername()]),
        )

        assertLoggerCall(true, true)

        expect(mockedUserRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('when infrastructure fails', () => {
      it('should throw error when PasswordHasher fails', async () => {
        const hashingError = new Error('Unexpected hashing failed')

        mockedHasherService.hash.mockImplementation(() => {
          throw hashingError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(hashingError)
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should throw error when userRepository fails during save', async () => {
        const dbError = new Error('Unexpected DB error inside transaction')

        mockedUserRepository.save.mockImplementation(() => {
          throw dbError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(dbError)
        expect(mockedCredentialRepository.save).not.toHaveBeenCalled()
      })
    })
  })
})
