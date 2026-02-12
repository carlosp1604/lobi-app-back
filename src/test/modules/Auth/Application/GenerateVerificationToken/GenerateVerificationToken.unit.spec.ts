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
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import {
  RequestOriginApplicationService,
  RequestOriginData,
} from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-29T15:35:00Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const email = VerificationTokenEmailMother.random()
  const userEmail = UserEmail.fromString(email.toString())
  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()

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
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const validIpHash = UserSessionIpHashMother.valid()
  const validUA = UserAgentMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()

  const expectedRequestOriginData: RequestOriginData = {
    userAgent: validUA,
    ipHash: validIpHash.toString(),
    normalizedIp: 'normalized-ip',
    deviceLocation: validDeviceLocation,
  }

  const requestBase: GenerateVerificationTokenApplicationRequestDto = {
    email: email.toString(),
    purpose: purposeCreateAccount.toString(),
    sendNewToken: false,
    language: 'es',
    ip: '8.8.8.8',
    userAgent: validUA.toString(),
  }

  const expectedEmailContext = {
    token: generatedCode,
    expiration_minutes: verificationTokenTtlMs / (60 * 1000),
  }

  const user = new UserTestBuilder().withEmail(userEmail).withDeletedAt(null).withStatus(UserStatus.active()).build()

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
    mockReset(mockedRequestOriginService)

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
    mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(null)
    mockedRandomService.getRandomNumericCode.mockReturnValue(generatedCode)
    mockedHasherService.hash.mockResolvedValue(verificationTokenTokenHash.toString())
    mockedRequestOriginService.process.mockResolvedValue(expectedRequestOriginData)
    mockedIdGeneratorService.generateId
      .mockReturnValueOnce(verificationTokenId.toString())
      .mockReturnValueOnce(domainEventId.toString())

    mockedEmailSenderService.sendWithTemplate.mockResolvedValue(undefined)
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

      expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(email.toString())
      expect(mockedVerificationTokenRepository.findByEmailWithLock).toHaveBeenCalledWith(email.toString(), fakeContext)
      expect(mockedRandomService.getRandomNumericCode).toHaveBeenCalledWith(verificationTokenLength)
      expect(mockedHasherService.hash).toHaveBeenCalledWith(String(generatedCode))
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledWith(expectedVerificationToken, fakeContext)

      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: DomainEventAggregateId.fromString(verificationTokenId.toString()),
          aggregateType: DomainEventAggregateType.verificationToken(),
          id: domainEventId,
          name: DomainEventName.emailVerificationRequest(),
          occurredAt: now,
          payload: {
            email: email.toString(),
            purpose: purpose.toString(),
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
            ipHash: originData.ipHash ? originData.ipHash.toString() : null,
            ua: originData.userAgent.toString(),
          },
        }),
        fakeContext,
      )

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

    const testNonExistentTokenCase = async (purpose: VerificationTokenPurpose, originData: RequestOriginData) => {
      const useCase = buildUseCase()

      const expectedVerificationToken = createVerificationTokenTestBuilder().withPurpose(purpose).build()

      const request = { ...requestBase, purpose: purpose.toString(), sendNewToken: false }

      const result = await useCase.execute(request)

      assertCommonCalls(purpose, expectedVerificationToken, false, request.language, originData)
      expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    }

    const testActiveTokenAndSendNewTokenIsTrueCase = async (purpose: VerificationTokenPurpose, originData: RequestOriginData) => {
      const expectedVerificationToken = createVerificationTokenTestBuilder().withPurpose(purpose).build()

      const existingToken = createVerificationTokenTestBuilder()
        .withPurpose(purpose)
        .withId(VerificationTokenIdMother.valid())
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .build()

      mockedUserRepository.findByEmail.mockResolvedValue(user)
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

      const requestWithResend = { ...requestBase, purpose: purpose.toString(), sendNewToken: true }

      const useCase = buildUseCase()

      const result = await useCase.execute(requestWithResend)

      assertCommonCalls(purpose, expectedVerificationToken, true, requestWithResend.language, originData)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.toString(), fakeContext)

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

      const expectedVerificationToken = createVerificationTokenTestBuilder().withPurpose(purpose).build()

      const existingToken = createVerificationTokenTestBuilder()
        .withId(VerificationTokenIdMother.valid())
        .withPurpose(existingTokenPurpose)
        .withTokenHash(VerificationTokenTokenHashMother.random())
        .withExpiresAt(scenario.isExpired ? pastDate : futureDate)
        .withUsedAt(scenario.isUsed ? now : null)
        .build()

      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

      const request = { ...requestBase, purpose: purpose.toString(), sendNewToken: false }

      const result = await useCase.execute(request)

      assertCommonCalls(purpose, expectedVerificationToken, false, request.language, originData)

      if (!scenario.isUsed) {
        expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)
        expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith(existingToken.id.toString(), fakeContext)
      } else {
        expect(mockedVerificationTokenRepository.delete).not.toHaveBeenCalled()
      }

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    }

    describe('when IP, UserAgent and DeviceLocation are available', () => {
      it('should call services correctly when active token does not exist', async () => {
        await testNonExistentTokenCase(purposeCreateAccount, expectedRequestOriginData)
      })

      it('should call services correctly when active token exists and sendNewToken is true', async () => {
        await testActiveTokenAndSendNewTokenIsTrueCase(purposeResetPassword, expectedRequestOriginData)
      })

      it('should call services correctly when active token exists but it is already used and sendNewToken is false', async () => {
        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
          isUsed: true,
          isExpired: false,
          isDifferentPurpose: false,
        })
      })

      it('should call services correctly when active token exists but it is for a different purpose and sendNewToken is false', async () => {
        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
          isUsed: false,
          isExpired: false,
          isDifferentPurpose: true,
        })
      })

      it('should call services correctly when active token exists but it is already expired and sendNewToken is false', async () => {
        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, expectedRequestOriginData, {
          isUsed: false,
          isExpired: true,
          isDifferentPurpose: false,
        })
      })
    })

    describe('when IP is NULL, UserAgent is unknown or DeviceLocation is NULL', () => {
      it('should call services correctly when active token does not exist', async () => {
        const nullishIpOriginData = {
          ...expectedRequestOriginData,
          ipHash: null,
          normalizedIp: null,
          deviceLocation: null,
        }

        mockedRequestOriginService.process.mockResolvedValue(nullishIpOriginData)

        await testNonExistentTokenCase(purposeCreateAccount, nullishIpOriginData)
      })

      it('should call services correctly when active token exists and sendNewToken is true', async () => {
        const nullishDeviceLocationOriginData = {
          ...expectedRequestOriginData,
          ipHash: null,
          normalizedIp: null,
          deviceLocation: null,
        }

        mockedRequestOriginService.process.mockResolvedValue(nullishDeviceLocationOriginData)

        await testActiveTokenAndSendNewTokenIsTrueCase(purposeResetPassword, nullishDeviceLocationOriginData)
      })

      it('should call services correctly when active token exists but it is already used and sendNewToken is false', async () => {
        const unknownUserAgentOriginData = {
          ...expectedRequestOriginData,
          userAgent: UserAgent.unknown(),
        }

        mockedRequestOriginService.process.mockResolvedValue(unknownUserAgentOriginData)

        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, unknownUserAgentOriginData, {
          isUsed: true,
          isExpired: false,
          isDifferentPurpose: false,
        })
      })

      it('should call services correctly when active token exists but it is for a different purpose and sendNewToken is false', async () => {
        const unknownUserAgentOriginData = {
          ...expectedRequestOriginData,
          userAgent: UserAgent.unknown(),
        }

        mockedRequestOriginService.process.mockResolvedValue(unknownUserAgentOriginData)

        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, unknownUserAgentOriginData, {
          isUsed: false,
          isExpired: false,
          isDifferentPurpose: true,
        })
      })

      it('should call services correctly when active token exists but it is already expired and sendNewToken is false', async () => {
        const unknownUserAgentOriginData = {
          ...expectedRequestOriginData,
          userAgent: UserAgent.unknown(),
        }

        mockedRequestOriginService.process.mockResolvedValue(unknownUserAgentOriginData)

        await testActiveUnusableTokenAndSendNewTokenIsFalseCase(purposeCreateAccount, unknownUserAgentOriginData, {
          isUsed: false,
          isExpired: true,
          isDifferentPurpose: false,
        })
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
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)
      mockedUserRepository.findByEmail.mockResolvedValue(user)

      const useCase = buildUseCase()

      const result = await useCase.execute(requestBase)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.toString()),
      })

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      expect(mockedVerificationTokenRepository.findByEmailWithLock).not.toHaveBeenCalled()
      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Create account requested for an already taken email', {
        email: email.toString(),
      })
    })

    describe('when purpose is resetPassword and user does not exist, is deleted or is not active', () => {
      beforeEach(() => {
        const existingToken = createVerificationTokenTestBuilder().build()
        mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)
      })

      const testCase = async (ipOverride?: string) => {
        const useCase = buildUseCase()

        const resetPasswordRequest = {
          ...requestBase,
          ip: ipOverride ?? requestBase.ip,
          purpose: purposeResetPassword.toString(),
        }

        const result = await useCase.execute(resetPasswordRequest)

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
        expect(mockedVerificationTokenRepository.findByEmailWithLock).not.toHaveBeenCalled()

        expect(result).toEqual({
          success: true,
          value: undefined,
        })
      }

      it('should return success when user does not exist', async () => {
        const longIpAttack = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'.padEnd(50, '_Attack')

        mockedUserRepository.findByEmail.mockResolvedValue(null)

        await testCase(longIpAttack)

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'NotFound',
          ip: longIpAttack.slice(0, 39),
          userAgent: validUA.toString(),
        })
      })

      it('should return success when user is deleted', async () => {
        const deletedUser = new UserTestBuilder().withEmail(userEmail).withDeletedAt(now).withStatus(UserStatus.active()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase()

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'Inactive',
          ip: requestBase.ip.slice(0, 39),
          userAgent: validUA.toString(),
        })
      })

      it('should return success when user is not active', async () => {
        const deletedUser = new UserTestBuilder().withEmail(userEmail).withDeletedAt(null).withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByEmail.mockResolvedValue(deletedUser)

        await testCase()

        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Password reset requested for non-existent or inactive email', {
          email: email.toString(),
          reason: 'Inactive',
          ip: requestBase.ip.slice(0, 39),
          userAgent: validUA.toString(),
        })
      })
    })

    it('should return error when token exists, is usable, and sendNewToken is false', async () => {
      const existingToken = createVerificationTokenTestBuilder().build()
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)

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

    it('should re-throw exception when entity throws a non-domain error', async () => {
      const existingToken = createVerificationTokenTestBuilder().build()
      mockedVerificationTokenRepository.findByEmailWithLock.mockResolvedValue(existingToken)
      const useCase = buildUseCase()

      const unhandledDomainError = new Error('Unexpected error')

      jest.spyOn(existingToken, 'validate').mockImplementation(() => {
        throw unhandledDomainError
      })

      await expect(useCase.execute(requestBase)).rejects.toThrow(unhandledDomainError)
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
