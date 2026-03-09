/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenPurposeMother } from '~/src/test/mothers/VerificationTokenPurposeMother'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'

describe('ValidateVerificationToken', () => {
  const now = new Date('2026-02-12T11:41:00Z')
  const email = EmailAddressMother.random()
  const purpose = VerificationTokenPurpose.createAccount()
  const tokenValue = VerificationTokenValueMother.valid().value
  const tokenHash = VerificationTokenTokenHashMother.random()
  const tokenId = IdentifierMother.valid()

  const mockedTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedClockService = mock<ClockServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()

  const requestBase: ValidateVerificationTokenApplicationRequestDto = {
    email: email.value,
    purpose: purpose.value,
    token: tokenValue,
  }

  const buildUseCase = () => {
    return new ValidateVerificationToken(mockedTokenRepository, mockedVerifyTokenService, mockedClockService, mockedLogger)
  }

  const verificationTokenTestBuilder = () => {
    return new VerificationTokenTestBuilder()
      .withId(tokenId)
      .withEmail(email)
      .withPurpose(purpose)
      .withTokenHash(tokenHash)
      .withCreatedAt(now)
      .withExpiresAt(new Date(now.getTime() + 10000))
      .withUsedAt(null)
  }

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedTokenRepository)
    mockReset(mockedVerifyTokenService)
    mockReset(mockedClockService)
    mockReset(mockedLogger)

    mockedClockService.now.mockReturnValue(now)
    mockedVerifyTokenService.verify.mockResolvedValue(true)
  })

  describe('happy path', () => {
    it('should call services correctly and return success when token is valid and correct', async () => {
      const useCase = buildUseCase()
      const verificationToken = verificationTokenTestBuilder().build()

      mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)

      const result = await useCase.execute(requestBase)

      expect(mockedTokenRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedTokenRepository.findByEmail).toHaveBeenCalledWith(email.value)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledWith(verificationToken, tokenValue)
      expect(mockedLogger.warn).not.toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    })
  })

  describe('when there are errors', () => {
    describe('when there are input errors', () => {
      it('should return invalidEmail error when email is not valid', async () => {
        const invalidEmail = EmailAddressMother.invalid()
        const invalidEmailRequest = { ...requestBase, email: invalidEmail }
        const useCase = buildUseCase()

        const result = await useCase.execute(invalidEmailRequest)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.invalidEmail(invalidEmail),
        })

        expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
      })

      it('should return invalidTokenPurpose error when purpose is not valid', async () => {
        const invalidTokenPurpose = VerificationTokenPurposeMother.invalid()
        const invalidPurposeRequest = { ...requestBase, purpose: invalidTokenPurpose }
        const useCase = buildUseCase()

        const result = await useCase.execute(invalidPurposeRequest)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.invalidTokenPurpose(invalidTokenPurpose),
        })

        expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
      })

      it('should return invalidTokenFormat error when token format is not valid', async () => {
        const invalidTokenValue = VerificationTokenValueMother.invalid()
        const invalidTokenRequest = { ...requestBase, token: invalidTokenValue }
        const useCase = buildUseCase()

        const result = await useCase.execute(invalidTokenRequest)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.invalidTokenFormat(),
        })

        expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
      })
    })

    describe('when token is not valid (not found, expired, used, incorrect code, incorrect user, incorrect purpose)', () => {
      const asserInvalidTokenLoggerCall = (expectedErrorMessage: string, expectedReason: string, expectedToken: VerificationToken) => {
        expect(mockedLogger.warn).toHaveBeenCalledWith('Verification token validation failed', {
          error: expectedErrorMessage,
          reason: expectedReason,
          email: expectedToken.email.value,
          expiresAt: expectedToken.expiresAt,
          usedAt: expectedToken.usedAt,
          purpose: expectedToken.purpose.value,
          verificationTokenId: expectedToken.id.value,
        })
      }

      it('should return notFound error when token does not exist', async () => {
        const useCase = buildUseCase()
        mockedTokenRepository.findByEmail.mockResolvedValue(null)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.notFound(),
        })

        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return expired error when token is expired', async () => {
        const useCase = buildUseCase()
        const expiredToken = verificationTokenTestBuilder()
          .withExpiresAt(new Date(now.getTime() - 1000))
          .build()

        mockedTokenRepository.findByEmail.mockResolvedValue(expiredToken)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.expired(),
        })

        asserInvalidTokenLoggerCall(
          VerificationTokenDomainException.alreadyExpired(expiredToken.id.value).message,
          'Token has already expired',
          expiredToken,
        )
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return alreadyUsed error when token is already used', async () => {
        const useCase = buildUseCase()
        const usedToken = verificationTokenTestBuilder().withUsedAt(now).build()

        mockedTokenRepository.findByEmail.mockResolvedValue(usedToken)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.alreadyUsed(),
        })

        asserInvalidTokenLoggerCall(
          VerificationTokenDomainException.alreadyUsed(usedToken.id.value).message,
          'Token was already used',
          usedToken,
        )
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return invalidOwner error when token email does not match request email', async () => {
        const useCase = buildUseCase()
        const otherEmail = EmailAddressMother.random()
        const tokenWithOtherEmail = verificationTokenTestBuilder().withEmail(otherEmail).build()

        mockedTokenRepository.findByEmail.mockResolvedValue(tokenWithOtherEmail)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.invalidOwner(),
        })

        asserInvalidTokenLoggerCall(
          VerificationTokenDomainException.cannotBeUsedByUser(tokenWithOtherEmail.id.value, email.value).message,
          'Token belongs to a different email address',
          tokenWithOtherEmail,
        )
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should return tokenPurposeMismatch error when token purpose does not match request purpose', async () => {
        const useCase = buildUseCase()
        const otherPurpose = VerificationTokenPurpose.resetPassword()
        const tokenWithOtherPurpose = verificationTokenTestBuilder().withPurpose(otherPurpose).build()

        mockedTokenRepository.findByEmail.mockResolvedValue(tokenWithOtherPurpose)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.tokenPurposeMismatch(),
        })

        asserInvalidTokenLoggerCall(
          VerificationTokenDomainException.cannotBeUsedForPurpose(tokenWithOtherPurpose.id.value, purpose.value).message,
          'Token was not generated for the requested purpose',
          tokenWithOtherPurpose,
        )
        expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
      })

      it('should throw exception when entity returns a unexpected VerificationTokenDomainException', async () => {
        const useCase = buildUseCase()
        const verificationToken = verificationTokenTestBuilder().build()

        mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)

        const unhandledDomainError = VerificationTokenDomainException.invalidTokenHash()

        jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
          return { success: false, error: unhandledDomainError }
        })

        await expect(useCase.execute(requestBase)).rejects.toThrow(unhandledDomainError)
      })

      it('should return invalidToken error when cryptographic verification fails', async () => {
        const useCase = buildUseCase()
        const verificationToken = verificationTokenTestBuilder().build()

        mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)
        mockedVerifyTokenService.verify.mockResolvedValue(false)

        const result = await useCase.execute(requestBase)

        expect(result).toEqual({
          success: false,
          error: ValidateVerificationTokenError.invalidToken(),
        })
        expect(mockedLogger.warn).toHaveBeenCalledWith('Token cryptography verification failed', {
          email: email.value,
        })
      })
    })

    it('should throw exception when repository throws a unexpected error', async () => {
      const useCase = buildUseCase()
      const dbError = new Error('Unexpected verificationTokenRepository error')

      mockedTokenRepository.findByEmail.mockRejectedValue(dbError)

      await expect(useCase.execute(requestBase)).rejects.toThrow(dbError)
    })

    it('should throw exception when verify service throws a unexpected error', async () => {
      const useCase = buildUseCase()
      const verificationToken = verificationTokenTestBuilder().build()
      const verifyError = new Error('Unexpected verifyTokenService error')

      mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)
      mockedVerifyTokenService.verify.mockRejectedValue(verifyError)

      await expect(useCase.execute(requestBase)).rejects.toThrow(verifyError)
    })
  })
})
