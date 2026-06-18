/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { ResetUserPasswordApplicationRequestDto } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationRequestDto'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { ResetUserPassword } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPassword'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

describe('ResetUserPassword', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialRepository = mock<UserCredentialRepositoryInterface>()
  const mockedVerificationTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedDomainEventFactory = mock<AuthDomainEventFactory>()
  const mockedExpectedDomainEvent = mock<DomainEvent>()

  const now = new Date('2026-02-19T12:10:00.000Z')
  const pastDate = new Date(now.getTime() - 3600 * 1000)
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validEmail = EmailAddressMother.valid()
  const validNewPassword = UserPasswordMother.valid()
  const validTokenValue = VerificationTokenValueMother.valid()
  const validUserId = IdentifierMother.valid()
  const validTokenId = IdentifierMother.valid()

  const oldPasswordHash = PasswordHashMother.valid()
  const newPasswordHash = PasswordHashMother.other()

  let baseRequest: ResetUserPasswordApplicationRequestDto
  let verificationTokenBuilder: VerificationTokenTestBuilder
  let userTestBuilder: UserTestBuilder
  let userCredentialBuilder: UserCredentialTestBuilder

  const buildUseCase = () => {
    return new ResetUserPassword(
      mockedUserRepository,
      mockedCredentialRepository,
      mockedVerificationTokenRepository,
      mockedDomainEventRepository,
      mockedVerifyTokenService,
      mockedHasherService,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedDomainEventFactory,
    )
  }

  beforeEach(() => {
    jest.restoreAllMocks()
    mockReset(mockedUserRepository)
    mockReset(mockedCredentialRepository)
    mockReset(mockedVerificationTokenRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedVerifyTokenService)
    mockReset(mockedHasherService)
    mockReset(mockedClock)
    mockReset(mockedLogger)
    mockReset(mockedUnitOfWork)
    mockReset(mockedDomainEventFactory)

    baseRequest = {
      email: validEmail.value,
      password: validNewPassword.value,
      token: validTokenValue.value,
      clientMetadata: new ClientMetadataResponseTestBuilder().build(),
    }

    verificationTokenBuilder = new VerificationTokenTestBuilder()
      .withId(validTokenId)
      .withEmail(validEmail)
      .withPurpose(VerificationTokenPurpose.resetPassword())
      .withExpiresAt(futureDate)
      .withUsedAt(null)

    mockedClock.now.mockReturnValue(now)
    mockedHasherService.hash.mockResolvedValue(newPasswordHash.value)
    mockedHasherService.compare.mockResolvedValue(false)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    const expectedVerificationToken = verificationTokenBuilder.build()
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expectedVerificationToken)
    mockedVerifyTokenService.verify.mockResolvedValue(true)

    userTestBuilder = new UserTestBuilder()
      .withId(validUserId)
      .withEmail(validEmail)
      .withStatus(UserStatus.active())
      .withDeletedAt(null)

    const expectedUser = userTestBuilder.build()

    userCredentialBuilder = new UserCredentialTestBuilder().withUserId(validUserId).withPasswordHash(oldPasswordHash)
    const expectedCredential = userCredentialBuilder.build()

    mockedUserRepository.findByEmail.mockResolvedValue(expectedUser)
    mockedCredentialRepository.findByUserId.mockResolvedValue(expectedCredential)

    mockedDomainEventFactory.createPasswordResetEvent.mockReturnValue(mockedExpectedDomainEvent)
  })

  describe('happy path', () => {
    it('should call services, repositories and entities correctly and return success', async () => {
      let usedAtAtMomentOfVerify: Date | null = null

      mockedVerifyTokenService.verify.mockImplementation(async (token) => {
        usedAtAtMomentOfVerify = token.usedAt
        return Promise.resolve(true)
      })

      const useCase = buildUseCase()

      const result = await useCase.execute(baseRequest)

      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.compare).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createPasswordResetEvent).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      const tokenPassedToVerify = mockedVerifyTokenService.verify.mock.calls[0][0]
      expect(usedAtAtMomentOfVerify).toBeNull()
      expect(tokenPassedToVerify.id.equals(validTokenId)).toBe(true)
      expect(tokenPassedToVerify.email.equals(validEmail)).toBe(true)
      expect(mockedVerifyTokenService.verify.mock.calls[0][1]).toBe(validTokenValue.value)

      const [updatedCredential, credentialCtx] = mockedCredentialRepository.update.mock.calls[0]
      expect(updatedCredential.userId.equals(validUserId)).toBe(true)
      expect(updatedCredential.passwordHash.equals(newPasswordHash)).toBe(true)
      expect(updatedCredential.updatedAt).toEqual(now)
      expect(updatedCredential.lastModifiedAt).toEqual(now)
      expect(credentialCtx).toBe(fakeContext)

      const [tokenAfterUpdate, tokenCtx] = mockedVerificationTokenRepository.update.mock.calls[0]
      expect(tokenAfterUpdate.usedAt).toEqual(now)
      expect(tokenCtx).toBe(fakeContext)

      expect(mockedHasherService.hash).toHaveBeenCalledWith(baseRequest.password)
      expect(mockedDomainEventFactory.createPasswordResetEvent).toHaveBeenCalledWith(
        validUserId,
        validEmail,
        baseRequest.clientMetadata.deviceLocation,
        baseRequest.clientMetadata.deviceInfo,
        baseRequest.clientMetadata.userIpHash,
        now,
      )

      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(mockedExpectedDomainEvent, fakeContext)

      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.warn).not.toHaveBeenCalled()

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
    })
  })

  describe('when there are errors', () => {
    describe('when input data is not valid', () => {
      it('should return invalidInput error when email is invalid', async () => {
        const useCase = buildUseCase()

        const invalidEmail = EmailAddressMother.invalid()
        const result = await useCase.execute({ ...baseRequest, email: invalidEmail })

        const expectedDomainMessageError = SharedDomainException.invalidEmailAddress(invalidEmail).message

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([
            ResetUserPasswordError.validationError('email', expectedDomainMessageError),
          ]),
        })
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return invalidInput error when token format is invalid', async () => {
        const useCase = buildUseCase()

        const invalidTokenValue = VerificationTokenValueMother.invalid()
        const result = await useCase.execute({ ...baseRequest, token: invalidTokenValue })

        const expectedDomainMessageError = VerificationTokenDomainException.invalidVerificationTokenValue().message

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([
            ResetUserPasswordError.validationError('token', expectedDomainMessageError),
          ]),
        })
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return invalidInput error when password is invalid', async () => {
        const useCase = buildUseCase()

        const invalidPassword = UserPasswordMother.invalid()
        const result = await useCase.execute({ ...baseRequest, password: invalidPassword })

        const expectedDomainMessageError = UserCredentialDomainException.invalidPasswordFormat().message

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([
            ResetUserPasswordError.validationError('password', expectedDomainMessageError),
          ]),
        })
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })

      it('should return invalidInput error when multiple inputs are invalid', async () => {
        const useCase = buildUseCase()

        const invalidEmail = EmailAddressMother.invalid()

        const result = await useCase.execute({
          ...baseRequest,
          email: invalidEmail,
          password: UserPasswordMother.invalid(),
        })

        const expectedInvalidEmailDomainMessageError = SharedDomainException.invalidEmailAddress(invalidEmail).message
        const expectedInvalidPasswordDomainMessageError = UserCredentialDomainException.invalidPasswordFormat().message

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([
            ResetUserPasswordError.validationError('email', expectedInvalidEmailDomainMessageError),
            ResetUserPasswordError.validationError('password', expectedInvalidPasswordDomainMessageError),
          ]),
        })
        expect(mockedHasherService.hash).not.toHaveBeenCalled()
      })
    })

    describe('when token is not valid (not found, expired, used, incorrect code, incorrect user, incorrect purpose)', () => {
      it('should return notFound error when token does not exist', async () => {
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.tokenNotFound(),
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken error when token is already expired', async () => {
        const expiredVerificationToken = verificationTokenBuilder.withExpiresAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expiredVerificationToken)

        const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyExpired().message

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)
        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.tokenExpired(expectedDomainErrorMessage),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: VerificationTokenDomainException.alreadyExpired().message,
          reason: 'Token has already expired',
          email: expiredVerificationToken.email.value,
          expiresAt: expiredVerificationToken.expiresAt,
          usedAt: expiredVerificationToken.usedAt,
          purpose: expiredVerificationToken.purpose.value,
          verificationTokenId: expiredVerificationToken.id.value,
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken error when token is already used', async () => {
        const usedVerificationToken = verificationTokenBuilder.withUsedAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(usedVerificationToken)

        const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyUsed().message

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.tokenAlreadyUsed(expectedDomainErrorMessage),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: VerificationTokenDomainException.alreadyUsed().message,
          reason: 'Token was already used',
          email: usedVerificationToken.email.value,
          expiresAt: usedVerificationToken.expiresAt,
          usedAt: usedVerificationToken.usedAt,
          purpose: usedVerificationToken.purpose.value,
          verificationTokenId: usedVerificationToken.id.value,
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken when token does not belong to user', async () => {
        const anotherEmail = EmailAddressMother.random()
        const verificationToken = verificationTokenBuilder.withEmail(anotherEmail).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const expectedDomainException = VerificationTokenDomainException.cannotBeUsedByUser(validEmail.value)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.tokenInvalidOwner(expectedDomainException.message),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: expectedDomainException.message,
          reason: 'Token belongs to a different email address',
          email: verificationToken.email.value,
          requestEmail: validEmail.value,
          expiresAt: verificationToken.expiresAt,
          usedAt: verificationToken.usedAt,
          purpose: verificationToken.purpose.value,
          verificationTokenId: verificationToken.id.value,
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken when token cannot be used for the current operation', async () => {
        const notResetPasswordToken = verificationTokenBuilder.withPurpose(VerificationTokenPurpose.createAccount()).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(notResetPasswordToken)

        const expectedDomainException = VerificationTokenDomainException.cannotBeUsedForPurpose()

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.tokenPurposeMismatch(expectedDomainException.message),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: expectedDomainException.message,
          reason: 'Token was not generated for password reset',
          email: notResetPasswordToken.email.value,
          expiresAt: notResetPasswordToken.expiresAt,
          usedAt: notResetPasswordToken.usedAt,
          purpose: notResetPasswordToken.purpose.value,
          verificationTokenId: notResetPasswordToken.id.value,
        })
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidToken error when cryptographic verification fails', async () => {
        mockedVerifyTokenService.verify.mockResolvedValue(false)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Token cryptography verification failed', {
          email: validEmail.value,
          purpose: VerificationTokenPurpose.resetPassword().value,
          verificationTokenId: validTokenId.value,
        })
        expect(mockedUserRepository.findByEmail).not.toHaveBeenCalled()
      })

      it('should throw exception when entity returns a unexpected VerificationTokenDomainException', async () => {
        const verificationToken = verificationTokenBuilder.build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const unhandledDomainError = VerificationTokenDomainException.invalidTokenHash()
        jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
          return {
            success: false,
            error: unhandledDomainError,
          }
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(baseRequest)).rejects.toThrow(unhandledDomainError)
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })
    })

    describe('when user or credential issues occur', () => {
      it('should return userNotFound error when user does not exist', async () => {
        mockedUserRepository.findByEmail.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.userNotFound(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Data anomaly detected', {
          email: validEmail.value,
          reason: 'Attempted to consume an orphaned reset-password token for a deleted user',
        })
        expect(mockedCredentialRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return userDisabled error when user is not active', async () => {
        const inactiveUser = userTestBuilder.withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(inactiveUser)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.userDisabled(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset rejected', {
          email: validEmail.value,
          reason: 'User is disabled',
        })
        expect(mockedCredentialRepository.findByUserId).not.toHaveBeenCalled()
      })

      it('should return userDoesNotHaveCredentials error when an active user has no credentials', async () => {
        mockedCredentialRepository.findByUserId.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.userDoesNotHaveCredentials(),
        })
        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
          userId: validUserId.value,
          reason: 'Active user has no credentials',
        })
        expect(mockedHasherService.compare).not.toHaveBeenCalled()
      })

      it('should return cannotResetPassword error when new password is the same as the current one', async () => {
        mockedHasherService.compare.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toEqual({
          success: false,
          error: ResetUserPasswordApplicationError.samePasswordValue(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset rejected', {
          reason: 'The new password is the same as the current one',
          userId: validUserId.value,
        })
        expect(mockedDomainEventFactory.createPasswordResetEvent).not.toHaveBeenCalled()
      })
    })

    describe('when infrastructure fails', () => {
      it('should throw error when HasherService fails during hashing', async () => {
        const hashingError = new Error('Unexpected hashing error')

        mockedHasherService.hash.mockImplementation(() => {
          throw hashingError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(hashingError)
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should throw error when UserCredentialRepository fails during update', async () => {
        const dbError = new Error('Unexpected DB error')

        mockedCredentialRepository.update.mockImplementation(() => {
          throw dbError
        })

        const useCase = buildUseCase()
        await expect(useCase.execute(baseRequest)).rejects.toThrow(dbError)
        expect(mockedVerificationTokenRepository.update).not.toHaveBeenCalled()
      })
    })
  })
})
