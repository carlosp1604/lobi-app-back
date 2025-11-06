/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { GenerateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationRequestDto'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { RandomServiceInterface } from '~/src/modules/Shared/Domain/RandomServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEvent, EventPayload } from '~/src/modules/Shared/Domain/DomainEvent'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-29T15:35:00Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const email = UserEmailMother.random()
  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()

  const requestBase: GenerateVerificationTokenApplicationRequestDto = {
    email: email.toString(),
    purpose: purposeCreateAccount.toString(),
    sendNewToken: false,
    language: 'es',
  }

  const verificationTokenTtlMs = 900000
  const verificationTokenLength = 6
  const expiresAt = new Date(now.getTime() + verificationTokenTtlMs)
  const generatedCode = '123456'
  const verificationTokenTokenHash = VerificationTokenTokenHashMother.random()
  const verificationTokenId = VerificationTokenIdMother.valid()
  const domainEventId = DomainEventIdMother.valid()

  const mockedVerificationTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedEmailSenderService = mock<EmailSenderServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedClockService = mock<ClockServiceInterface>()
  const mockedRandomService = mock<RandomServiceInterface>()
  const mockedConfigService = mock<ConfigService>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedIdGeneratorService = mock<IdGeneratorServiceInterface>()

  const expectedDomainEventPayload: EventPayload = {
    email: email.toString(),
    purpose: purposeCreateAccount.toString(),
    resendCode: false,
    lang: 'es',
  }

  const expectedEmailContext = {
    token: generatedCode,
    expiration_minutes: verificationTokenTtlMs / (60 * 1000),
  }

  const user = new UserTestBuilder().withEmail(email).withDeletedAt(null).withStatus(UserStatus.active()).build()

  const buildUseCase = () => {
    return new GenerateVerificationToken(
      mockedVerificationTokenRepository,
      mockedUserRepository,
      mockedDomainEventRepository,
      mockedEmailSenderService,
      mockedUnitOfWork,
      mockedHasherService,
      mockedClockService,
      mockedRandomService,
      mockedConfigService,
      mockedLogger,
      mockedIdGeneratorService,
    )
  }

  const createDomainEventTestBuilder = () => {
    return new DomainEventTestBuilder()
      .withId(domainEventId)
      .withName(DomainEventName.emailVerificationRequest())
      .withAggregateType(DomainEventAggregateType.verificationToken())
      .withAggregateId(DomainEventAggregateId.fromString(verificationTokenId.toString()))
      .withPayload(expectedDomainEventPayload)
      .withMetadata({})
      .withOccurredAt(now)
  }

  const createVerificationTokenTestBuilder = () => {
    return new VerificationTokenTestBuilder()
      .withId(verificationTokenId)
      .withEmail(email)
      .withPurpose(purposeCreateAccount)
      .withTokenHash(verificationTokenTokenHash)
      .withCreatedAt(now)
      .withExpiresAt(expiresAt)
      .withUsedAt(null)
  }

  beforeEach(() => {
    mockReset(mockedVerificationTokenRepository)
    mockReset(mockedUserRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedEmailSenderService)
    mockReset(mockedUnitOfWork)
    mockReset(mockedHasherService)
    mockReset(mockedClockService)
    mockReset(mockedRandomService)
    mockReset(mockedConfigService)
    mockReset(mockedLogger)
    mockReset(mockedIdGeneratorService)

    mockedClockService.now.mockReturnValue(now)
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })
    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({
        VERIFICATION_TOKEN_TTL_MS: verificationTokenTtlMs,
        VERIFICATION_TOKEN_LENGTH: verificationTokenLength,
      }),
    )
    mockedUserRepository.findByEmail.mockResolvedValue(null)
    mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(null)
    mockedRandomService.getRandomNumericCode.mockReturnValue(generatedCode)
    mockedHasherService.hash.mockResolvedValue(verificationTokenTokenHash.toString())
    mockedIdGeneratorService.generateId
      .mockReturnValueOnce(verificationTokenId.toString())
      .mockReturnValueOnce(domainEventId.toString())

    mockedEmailSenderService.sendWithTemplate.mockResolvedValue(undefined)
  })

  describe('happy path', () => {
    const assertCommonCalls = (
      purpose: VerificationTokenPurpose,
      expectedDomainEvent: DomainEvent,
      expectedVerificationToken: VerificationToken,
    ) => {
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailAndPurposeWithLock).toHaveBeenCalledTimes(1)
      expect(mockedRandomService.getRandomNumericCode).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedIdGeneratorService.generateId).toHaveBeenCalledTimes(2)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()

      expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(email.toString())
      expect(mockedVerificationTokenRepository.findByEmailAndPurposeWithLock).toHaveBeenCalledWith(
        email.toString(),
        purpose.toString(),
        fakeContext,
      )
      expect(mockedRandomService.getRandomNumericCode).toHaveBeenCalledWith(verificationTokenLength)
      expect(mockedHasherService.hash).toHaveBeenCalledWith(String(generatedCode))
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(expectedDomainEvent, fakeContext)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledWith(expectedVerificationToken, fakeContext)
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledTimes(1)

      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledWith(
        email.toString(),
        purpose.equals(VerificationTokenPurpose.createAccount())
          ? 'verify-email-template-create-account'
          : 'verify-email-template-reset-password',
        expect.objectContaining(expectedEmailContext),
        'es',
        now,
      )
    }

    it('should call services correctly when active token does not exist', async () => {
      const useCase = buildUseCase()

      const expectedDomainEvent = createDomainEventTestBuilder().build()
      const expectedVerificationToken = createVerificationTokenTestBuilder().build()

      await useCase.execute(requestBase)

      assertCommonCalls(purposeCreateAccount, expectedDomainEvent, expectedVerificationToken)
      expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()
    })

    it('should call services correctly when active token exists and sendNewToken is true', async () => {
      const expectedDomainEvent = createDomainEventTestBuilder()
        .withPayload({ ...expectedDomainEventPayload, purpose: purposeResetPassword.toString(), resendCode: true })
        .build()
      const expectedVerificationToken = createVerificationTokenTestBuilder().withPurpose(purposeResetPassword).build()

      const existingToken = createVerificationTokenTestBuilder()
        .withId(VerificationTokenIdMother.valid())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .build()

      mockedUserRepository.findByEmail.mockResolvedValue(user)
      mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(existingToken)

      const requestWithResend = { ...requestBase, purpose: purposeResetPassword.toString(), sendNewToken: true }

      const useCase = buildUseCase()

      await useCase.execute(requestWithResend)

      assertCommonCalls(purposeResetPassword, expectedDomainEvent, expectedVerificationToken)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.toString(), fakeContext)
    })

    it('should call services correctly when active token exists but it is not usable and sendNewToken is false', async () => {
      const useCase = buildUseCase()

      const expectedDomainEvent = createDomainEventTestBuilder().build()
      const expectedVerificationToken = createVerificationTokenTestBuilder().build()

      const existingToken = createVerificationTokenTestBuilder()
        .withId(VerificationTokenIdMother.valid())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .withUsedAt(now)
        .build()

      mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(existingToken)

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: true,
        value: undefined,
      })

      assertCommonCalls(purposeCreateAccount, expectedDomainEvent, expectedVerificationToken)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.toString(), fakeContext)
    })

    it('should return the correct response', async () => {
      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const invalidEmailRequest = { ...requestBase, email: 'invalid-email' }

      const useCase = buildUseCase()

      const result = await useCase.execute(invalidEmailRequest)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.invalidEmail('invalid-email'),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when VerificationToken purpose is not valid', async () => {
      const invalidPurposeRequest = { ...requestBase, purpose: 'invalid-purpose' }

      const useCase = buildUseCase()

      const result = await useCase.execute(invalidPurposeRequest)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose'),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when purpose is createAccount and email is already taken', async () => {
      const existingToken = createVerificationTokenTestBuilder().build()
      mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(existingToken)
      mockedUserRepository.findByEmail.mockResolvedValue(user)

      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.toString()),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Create account requested for an already taken email', {
        email: email.toString(),
      })
    })

    describe('when purpose is resetPassword and user does not exist, is deleted or is not active', () => {
      beforeEach(() => {
        const existingToken = createVerificationTokenTestBuilder().build()
        mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(existingToken)
      })

      const testCase = async () => {
        const useCase = buildUseCase()

        const resetPasswordRequest = { ...requestBase, purpose: purposeResetPassword.toString() }

        const result = await useCase.execute(resetPasswordRequest)

        expect(result).toEqual({
          success: true,
          value: undefined,
        })

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      }

      it('should return success when user does not exist', async () => {
        mockedUserRepository.findByEmail.mockResolvedValue(null)

        await testCase()

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'NotFound',
        })
      })

      it('should return success when user is deleted', async () => {
        const deletedUser = new UserTestBuilder().withEmail(email).withDeletedAt(now).withStatus(UserStatus.active()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase()

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'Inactive',
        })
      })

      it('should return success when user is not active', async () => {
        const deletedUser = new UserTestBuilder().withEmail(email).withDeletedAt(null).withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase()

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'Inactive',
        })
      })
    })

    it('should return error when token exists, is usable, and sendNewToken is false', async () => {
      const existingToken = createVerificationTokenTestBuilder().build()
      mockedVerificationTokenRepository.findByEmailAndPurposeWithLock.mockResolvedValue(existingToken)

      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.toString(), purposeCreateAccount.toString()),
      })

      expect(mockedLogger.warn).toHaveBeenCalledWith('Email has already an active token for purpose', {
        email: email.toString(),
        purpose: purposeCreateAccount.toString(),
        tokenId: existingToken.id,
        tokenExpiresAt: existingToken.expiresAt.toISOString(),
      })
      expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()
      expect(mockedRandomService.getRandomNumericCode).not.toHaveBeenCalled()
      expect(mockedHasherService.hash).not.toHaveBeenCalled()
      expect(mockedDomainEventRepository.save).not.toHaveBeenCalled()
      expect(mockedVerificationTokenRepository.save).not.toHaveBeenCalled()
      expect(mockedEmailSenderService.sendWithTemplate).not.toHaveBeenCalled()
    })

    it('should throw error when emailSenderService fails', async () => {
      const emailError = new Error('Unexpected emailSenderService error')
      mockedEmailSenderService.sendWithTemplate.mockRejectedValueOnce(emailError)

      const useCase = buildUseCase()

      await expect(useCase.execute(requestBase)).rejects.toThrow(emailError)

      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should throw error when domainEventRepository fails', async () => {
      const dbError = new Error('Unexpected domainEventRepository error')
      mockedDomainEventRepository.save.mockRejectedValueOnce(dbError)

      const useCase = buildUseCase()

      await expect(useCase.execute(requestBase)).rejects.toThrow(dbError)

      expect(mockedVerificationTokenRepository.save).not.toHaveBeenCalled()
      expect(mockedEmailSenderService.sendWithTemplate).not.toHaveBeenCalled()
    })

    it('should throw error when verificationTokenRepository fails', async () => {
      const dbError = new Error('Unexpected verificationTokenRepository error')
      mockedVerificationTokenRepository.save.mockRejectedValueOnce(dbError)

      const useCase = buildUseCase()

      await expect(useCase.execute(requestBase)).rejects.toThrow(dbError)

      expect(mockedEmailSenderService.sendWithTemplate).not.toHaveBeenCalled()
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
    })
  })
})
