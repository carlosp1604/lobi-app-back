/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
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

describe('ResetUserPassword', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedCredentialRepository = mock<UserCredentialRepositoryInterface>()
  const mockedVerificationTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()
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
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  let baseRequest: ResetUserPasswordApplicationRequestDto
  let verificationTokenBuilder: VerificationTokenTestBuilder
  let userCredentialBuilder: UserCredentialTestBuilder
  let requestOriginData: RequestOriginData

  const buildUseCase = () => {
    return new ResetUserPassword(
      mockedUserRepository,
      mockedCredentialRepository,
      mockedVerificationTokenRepository,
      mockedDomainEventRepository,
      mockedVerifyTokenService,
      mockedHasherService,
      mockedRequestOriginService,
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
    mockReset(mockedRequestOriginService)
    mockReset(mockedClock)
    mockReset(mockedLogger)
    mockReset(mockedUnitOfWork)
    mockReset(mockedDomainEventFactory)

    baseRequest = {
      email: validEmail.value,
      password: validNewPassword.value,
      token: validTokenValue.value,
      ip: '8.8.8.8',
      userAgent: validUA.value,
    }

    verificationTokenBuilder = new VerificationTokenTestBuilder()
      .withId(validTokenId)
      .withEmail(validEmail)
      .withPurpose(VerificationTokenPurpose.resetPassword())
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
    mockedHasherService.hash.mockResolvedValue(newPasswordHash.value)
    mockedHasherService.compare.mockResolvedValue(false)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    const expectedVerificationToken = verificationTokenBuilder.build()
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expectedVerificationToken)
    mockedVerifyTokenService.verify.mockResolvedValue(true)

    const expectedUser = new UserTestBuilder()
      .withId(validUserId)
      .withEmail(validEmail)
      .withStatus(UserStatus.active())
      .withDeletedAt(null)
      .build()

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

      expect(mockedRequestOriginService.process).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.findByUserId).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.compare).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createPasswordResetEvent).toHaveBeenCalledTimes(1)
      expect(mockedCredentialRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedRequestOriginService.process).toHaveBeenCalledWith(baseRequest.ip, baseRequest.userAgent, {
        email: validEmail.value,
      })
      expect(mockedHasherService.hash).toHaveBeenCalledWith(baseRequest.password)

      const tokenPassedToVerify = mockedVerifyTokenService.verify.mock.calls[0][0]
      expect(usedAtAtMomentOfVerify).toBeNull()
      expect(tokenPassedToVerify.id.equals(validTokenId)).toBe(true)
      expect(tokenPassedToVerify.email.equals(validEmail)).toBe(true)
      expect(mockedVerifyTokenService.verify.mock.calls[0][1]).toBe(validTokenValue.value)

      const [updatedCredential, credentialCtx] = mockedCredentialRepository.update.mock.calls[0]
      expect(updatedCredential.userId.equals(validUserId)).toBe(true)
      expect(updatedCredential.passwordHash.equals(newPasswordHash)).toBe(true)
      expect(updatedCredential.updatedAt.getTime()).toBe(now.getTime())
      expect(credentialCtx).toBe(fakeContext)

      const [tokenAfterUpdate, tokenCtx] = mockedVerificationTokenRepository.update.mock.calls[0]
      expect(tokenAfterUpdate.usedAt?.getTime()).toBe(now.getTime())
      expect(tokenCtx).toBe(fakeContext)

      expect(mockedDomainEventFactory.createPasswordResetEvent).toHaveBeenCalledWith(
        validUserId,
        validEmail,
        validDeviceLocation,
        validUA,
        validIpHash.value,
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
      it('should return error when email is invalid', async () => {
        const useCase = buildUseCase()

        const invalidEmail = EmailAddressMother.invalid()
        const result = await useCase.execute({ ...baseRequest, email: invalidEmail })

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([ResetUserPasswordError.invalidEmail()]),
        })
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should return error when token format is invalid', async () => {
        const useCase = buildUseCase()

        const invalidTokenValue = VerificationTokenValueMother.invalid()
        const result = await useCase.execute({ ...baseRequest, token: invalidTokenValue })

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([ResetUserPasswordError.invalidTokenFormat()]),
        })
      })

      it('should return error when password is invalid', async () => {
        const useCase = buildUseCase()

        const invalidPassword = UserPasswordMother.invalid()
        const result = await useCase.execute({ ...baseRequest, password: invalidPassword })

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([ResetUserPasswordError.invalidPassword()]),
        })
      })

      it('should return multiple errors if multiple inputs are invalid', async () => {
        const useCase = buildUseCase()

        const result = await useCase.execute({
          ...baseRequest,
          email: EmailAddressMother.invalid(),
          password: UserPasswordMother.invalid(),
        })

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput([
            ResetUserPasswordError.invalidEmail(),
            ResetUserPasswordError.invalidPassword(),
          ]),
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
          error: ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.tokenNotFound(validEmail.value)),
        })
      })

      it('should return tokenExpired error when token is already expired', async () => {
        const expiredVerificationToken = verificationTokenBuilder.withExpiresAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(expiredVerificationToken)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenExpired()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: VerificationTokenDomainException.alreadyExpired(expiredVerificationToken.id.value).message,
          reason: 'Token has already expired',
          email: expiredVerificationToken.email.value,
          expiresAt: expiredVerificationToken.expiresAt,
          usedAt: expiredVerificationToken.usedAt,
          purpose: expiredVerificationToken.purpose.value,
          verificationTokenId: expiredVerificationToken.id.value,
        })
      })

      it('should return tokenAlreadyUsed error when token is already used', async () => {
        const usedVerificationToken = verificationTokenBuilder.withUsedAt(pastDate).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(usedVerificationToken)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenAlreadyUsed()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: VerificationTokenDomainException.alreadyUsed(usedVerificationToken.id.value).message,
          reason: 'Token was already used',
          email: usedVerificationToken.email.value,
          expiresAt: usedVerificationToken.expiresAt,
          usedAt: usedVerificationToken.usedAt,
          purpose: usedVerificationToken.purpose.value,
          verificationTokenId: usedVerificationToken.id.value,
        })
      })

      it('should return tokenInvalidOwner when token does not belong to user', async () => {
        const anotherEmail = EmailAddressMother.random()
        const verificationToken = verificationTokenBuilder.withEmail(anotherEmail).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(verificationToken)

        const domainException = VerificationTokenDomainException.cannotBeUsedByUser(verificationToken.id.value, validEmail.value)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenInvalidOwner()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: domainException.message,
          reason: 'Token belongs to a different email address',
          email: verificationToken.email.value,
          requestEmail: validEmail.value,
          expiresAt: verificationToken.expiresAt,
          usedAt: verificationToken.usedAt,
          purpose: verificationToken.purpose.value,
          verificationTokenId: verificationToken.id.value,
        })
      })

      it('should return tokenPurposeMismatch when token cannot be used for the current operation', async () => {
        const notResetPasswordToken = verificationTokenBuilder.withPurpose(VerificationTokenPurpose.createAccount()).build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(notResetPasswordToken)

        const domainException = VerificationTokenDomainException.cannotBeUsedForPurpose(
          notResetPasswordToken.id.value,
          VerificationTokenPurpose.resetPassword().value,
        )

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenPurposeMismatch()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: domainException.message,
          reason: 'Token was not generated for password reset',
          email: notResetPasswordToken.email.value,
          expiresAt: notResetPasswordToken.expiresAt,
          usedAt: notResetPasswordToken.usedAt,
          purpose: notResetPasswordToken.purpose.value,
          verificationTokenId: notResetPasswordToken.id.value,
        })
      })

      it('should return invalidToken error when cryptographic verification fails', async () => {
        mockedVerifyTokenService.verify.mockResolvedValue(false)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.invalidToken()),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Token cryptography verification failed', {
          email: validEmail.value,
        })
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
      })
    })

    describe('when user or credential issues occur', () => {
      it('should return userNotFound error when user does not exist', async () => {
        mockedUserRepository.findByEmail.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.userNotFound(validEmail.value)),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
          email: validEmail.value,
          reason: 'User not found',
        })
      })

      it('should return userNotFound error when user is inactive', async () => {
        const inactiveUser = new UserTestBuilder().withEmail(validEmail).withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(inactiveUser)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.userNotFound(validEmail.value)),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
          email: validEmail.value,
          reason: 'User is disabled',
        })
      })

      it('should return inconsistentState error when active user has no credentials', async () => {
        mockedCredentialRepository.findByUserId.mockResolvedValue(null)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.inconsistentState(validUserId.value),
        })
        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
          userId: validUserId.value,
          reason: 'Active user has no credentials',
        })
      })

      it('should return cannotResetPassword error when new password is the same as the current one', async () => {
        mockedHasherService.compare.mockResolvedValue(true)

        const useCase = buildUseCase()
        const result = await useCase.execute(baseRequest)

        expect(result).toMatchObject({
          success: false,
          error: ResetUserPasswordApplicationError.cannotResetPassword(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset rejected', {
          reason: 'The new password is the same as the current one',
          userId: validUserId.value,
        })
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

      it('should throw error when HasherService fails on hashing', async () => {
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
      })
    })
  })
})
