/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
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
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { VerificationTokenPurposeMother } from '~/src/test/mothers/VerificationTokenPurposeMother'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-29T15:35:00Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const verificationTokenEmail = EmailAddressMother.random()
  const userEmail = EmailAddress.fromString(verificationTokenEmail.value)
  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()

  const verificationTokenTtlMs = 900000
  const expiresAt = new Date(now.getTime() + verificationTokenTtlMs)
  const generatedCode = VerificationTokenValueMother.valid().value
  const verificationTokenTokenHash = VerificationTokenTokenHashMother.random()
  const verificationTokenId = IdentifierMother.valid()
  const domainEventId = IdentifierMother.valid()

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
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const validIpHash = UserSessionIpHashMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  let expectedRequestOriginData: RequestOriginData
  let userTestBuilder: UserTestBuilder
  let verificationTokenTestBuilder: VerificationTokenTestBuilder
  let requestBase: GenerateVerificationTokenApplicationRequestDto

  const buildUseCase = () => {
    return new GenerateVerificationToken(
      mockedVerificationTokenRepository,
      mockedUserRepository,
      mockedDomainEventRepository,
      mockedEmailSenderService,
      mockedUnitOfWork,
      mockedHasherService,
      mockedRequestOriginService,
      mockedClockService,
      mockedRandomService,
      mockedConfigService,
      mockedLogger,
      mockedIdGeneratorService,
    )
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
    mockReset(mockedRequestOriginService)

    expectedRequestOriginData = {
      userAgent: validUA,
      ipHash: validIpHash.value,
      normalizedIp: 'normalized-ip',
      deviceLocation: validDeviceLocation,
    }

    mockedClockService.now.mockReturnValue(now)
    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })
    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({
        VERIFICATION_TOKEN_TTL_MS: verificationTokenTtlMs,
      }),
    )
    mockedUserRepository.findByEmail.mockResolvedValue(null)
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(null)
    mockedRandomService.getRandomNumericCode.mockReturnValue(generatedCode)
    mockedHasherService.hash.mockResolvedValue(verificationTokenTokenHash.value)
    mockedRequestOriginService.process.mockResolvedValue(expectedRequestOriginData)
    mockedIdGeneratorService.generateId.mockReturnValueOnce(verificationTokenId.value).mockReturnValueOnce(domainEventId.value)

    mockedEmailSenderService.sendWithTemplate.mockResolvedValue(undefined)

    userTestBuilder = new UserTestBuilder().withEmail(userEmail).withDeletedAt(null).withStatus(UserStatus.active())

    verificationTokenTestBuilder = new VerificationTokenTestBuilder()
      .withId(verificationTokenId)
      .withEmail(verificationTokenEmail)
      .withPurpose(purposeCreateAccount)
      .withTokenHash(verificationTokenTokenHash)
      .withCreatedAt(now)
      .withExpiresAt(expiresAt)
      .withUsedAt(null)

    requestBase = {
      email: verificationTokenEmail.value,
      purpose: purposeCreateAccount.value,
      sendNewToken: false,
      language: 'es',
      ip: '8.8.8.8',
      userAgent: validUA.value,
    }
  })

  describe('happy path', () => {
    const assertCommonCalls = (
      purpose: VerificationTokenPurpose,
      expectedVerificationToken: VerificationToken,
      resendCode: boolean,
      lang: string,
      originData: RequestOriginData,
    ) => {
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledTimes(1)
      expect(mockedRandomService.getRandomNumericCode).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedIdGeneratorService.generateId).toHaveBeenCalledTimes(2)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).not.toHaveBeenCalled()

      expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(verificationTokenEmail.value)
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledWith(verificationTokenEmail.value, fakeContext)
      expect(mockedRandomService.getRandomNumericCode).toHaveBeenCalledWith(VerificationTokenValue.LENGTH)
      expect(mockedHasherService.hash).toHaveBeenCalledWith(String(generatedCode))
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledWith(expectedVerificationToken, fakeContext)

      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: verificationTokenId,
          aggregateType: DomainEventAggregateType.verificationToken(),
          id: domainEventId,
          name: DomainEventName.emailVerificationRequest(),
          occurredAt: now,
          payload: {
            email: verificationTokenEmail.value,
            purpose: purpose.value,
            resendCode,
            lang,
            deviceLocation: originData.deviceLocation
              ? {
                  countryCode: originData.deviceLocation.countryCode,
                  city: originData.deviceLocation.city,
                }
              : null,
          },
          metadata: {
            ipHash: originData.ipHash ? originData.ipHash : null,
            ua: originData.userAgent.value,
          },
        }),
        fakeContext,
      )

      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledWith(
        verificationTokenEmail.value,
        purpose.equals(VerificationTokenPurpose.createAccount())
          ? 'verify-email-template-create-account'
          : 'verify-email-template-reset-password',
        expect.objectContaining({
          token: generatedCode,
          expiration_minutes: verificationTokenTtlMs / (60 * 1000),
        }),
        'es',
        now,
      )
    }

    const testNonExistentTokenCase = async (purpose: VerificationTokenPurpose, originData: RequestOriginData) => {
      const useCase = buildUseCase()

      const expectedVerificationToken = verificationTokenTestBuilder.withPurpose(purpose).build()

      const request = { ...requestBase, purpose: purpose.value, sendNewToken: false }

      const result = await useCase.execute(request)

      assertCommonCalls(purpose, expectedVerificationToken, false, request.language, originData)
      expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    }

    const testActiveTokenAndSendNewTokenIsTrueCase = async (purpose: VerificationTokenPurpose, originData: RequestOriginData) => {
      const expectedVerificationToken = verificationTokenTestBuilder.withPurpose(purpose).build()

      const existingToken = verificationTokenTestBuilder
        .withPurpose(purpose)
        .withId(IdentifierMother.valid())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .build()

      const user = userTestBuilder.build()
      mockedUserRepository.findByEmail.mockResolvedValue(user)
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

      const requestWithResend = { ...requestBase, purpose: purpose.value, sendNewToken: true }

      const useCase = buildUseCase()

      const result = await useCase.execute(requestWithResend)

      assertCommonCalls(purpose, expectedVerificationToken, true, requestWithResend.language, originData)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.value, fakeContext)

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    }

    type TokenScenario = {
      isUsed?: boolean
      isExpired?: boolean
      isDifferentPurpose?: boolean
    }

    const testActiveUnusableTokenAndSendNewTokenIsFalseCase = async (
      purpose: VerificationTokenPurpose,
      originData: RequestOriginData,
      scenario: TokenScenario,
    ) => {
      const useCase = buildUseCase()

      const pastDate = new Date(now.getTime() - 3600 * 1000)
      const futureDate = new Date(now.getTime() + 3600 * 1000)

      let existingTokenPurpose = purpose
      if (scenario.isDifferentPurpose) {
        existingTokenPurpose = purpose.equals(VerificationTokenPurpose.createAccount())
          ? VerificationTokenPurpose.resetPassword()
          : VerificationTokenPurpose.createAccount()
      }

      const expectedVerificationToken = verificationTokenTestBuilder.withPurpose(purpose).build()

      const existingToken = verificationTokenTestBuilder
        .withId(IdentifierMother.valid())
        .withPurpose(existingTokenPurpose)
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .withExpiresAt(scenario.isExpired ? pastDate : futureDate)
        .withUsedAt(scenario.isUsed ? now : null)
        .build()

      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

      const request = { ...requestBase, purpose: purpose.value, sendNewToken: false }

      const result = await useCase.execute(request)

      assertCommonCalls(purpose, expectedVerificationToken, false, request.language, originData)

      if (!scenario.isUsed) {
        expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
        expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.value, fakeContext)
      } else {
        expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()
      }

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    }

    it('should call services correctly and return undefined when active token does not exist', async () => {
      await testNonExistentTokenCase(purposeCreateAccount, expectedRequestOriginData)
    })

    it('should call services correctly and return undefined when active token exists and sendNewToken is true', async () => {
      const nullishDeviceLocationOriginData = {
        ...expectedRequestOriginData,
        ipHash: null,
        normalizedIp: null,
        deviceLocation: null,
      }

      mockedRequestOriginService.process.mockResolvedValue(nullishDeviceLocationOriginData)

      await testActiveTokenAndSendNewTokenIsTrueCase(purposeResetPassword, nullishDeviceLocationOriginData)
    })

    it('should call services correctly and return undefined when active token exists but it is already used and sendNewToken is false', async () => {
      await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
        isUsed: true,
        isExpired: false,
        isDifferentPurpose: false,
      })
    })

    it('should call services correctly and return undefined when active token exists but it is for a different purpose and sendNewToken is false', async () => {
      await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
        isUsed: false,
        isExpired: false,
        isDifferentPurpose: true,
      })
    })

    it('should call services correctly and return undefined when active token exists but it is already expired and sendNewToken is false', async () => {
      await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
        isUsed: false,
        isExpired: true,
        isDifferentPurpose: false,
      })
    })
  })

  describe('when there are errors', () => {
    it('should return error when email is not valid', async () => {
      const invalidEmail = EmailAddressMother.invalid()
      const invalidEmailRequest = { ...requestBase, email: invalidEmail }

      const useCase = buildUseCase()

      const result = await useCase.execute(invalidEmailRequest)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.invalidEmail(invalidEmail),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when VerificationToken purpose is not valid', async () => {
      const invalidPurpose = VerificationTokenPurposeMother.invalid()
      const invalidPurposeRequest = { ...requestBase, purpose: invalidPurpose }

      const useCase = buildUseCase()

      const result = await useCase.execute(invalidPurposeRequest)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose(invalidPurpose),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return error when purpose is createAccount and email is already taken', async () => {
      const existingToken = verificationTokenTestBuilder.build()
      const user = userTestBuilder.build()

      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)
      mockedUserRepository.findByEmail.mockResolvedValue(user)

      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(verificationTokenEmail.value),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      expect(mockedVerificationTokenRepository.findByEmailWithLock).not.toHaveBeenCalled()
      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token generation rejected', {
        email: verificationTokenEmail.value,
        reason: 'Email is already registered and purpose is create account',
      })
    })

    describe('when purpose is resetPassword and user does not exist, is deleted or is not active', () => {
      beforeEach(() => {
        const existingToken = verificationTokenTestBuilder.build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)
      })

      const testCase = async (reason: string) => {
        const useCase = buildUseCase()

        const resetPasswordRequest = {
          ...requestBase,
          purpose: purposeResetPassword.value,
        }

        const result = await useCase.execute(resetPasswordRequest)

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
        expect(mockedVerificationTokenRepository.findByEmailWithLock).not.toHaveBeenCalled()

        expect(result).toEqual({
          success: true,
          value: undefined,
        })

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token generation rejected', {
          email: verificationTokenEmail.value,
          reason: reason,
          purpose: purposeResetPassword.value,
        })
      }

      it('should return success when user does not exist', async () => {
        mockedUserRepository.findByEmail.mockResolvedValue(null)

        await testCase('User not found')
      })

      it('should return success when user is deleted', async () => {
        const deletedUser = new UserTestBuilder().withEmail(userEmail).withDeletedAt(now).withStatus(UserStatus.active()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase('User is disabled')
      })

      it('should return success when user is not active', async () => {
        const deletedUser = new UserTestBuilder().withEmail(userEmail).withDeletedAt(null).withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase('User is disabled')
      })
    })

    it('should return error when token exists, is usable, and sendNewToken is false', async () => {
      const existingToken = verificationTokenTestBuilder.build()
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
          verificationTokenEmail.value,
          purposeCreateAccount.value,
        ),
      })

      expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token generation rejected', {
        email: verificationTokenEmail.value,
        purpose: purposeCreateAccount.value,
        tokenId: existingToken.id.value,
        tokenExpiresAt: existingToken.expiresAt,
        reason: 'An active token has already been issued for this purpose',
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
