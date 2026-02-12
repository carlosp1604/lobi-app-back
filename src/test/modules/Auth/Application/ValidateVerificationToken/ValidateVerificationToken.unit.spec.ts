/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'

describe('ValidateVerificationToken', () => {
  const now = new Date('2026-02-12T11:41:00Z')
  const email = VerificationTokenEmailMother.random()
  const purpose = VerificationTokenPurpose.createAccount()
  const tokenValue = VerificationTokenValueMother.valid().value
  const tokenHash = VerificationTokenTokenHashMother.random()
  const tokenId = VerificationTokenIdMother.valid()

  const mockedTokenRepository = mock<VerificationTokenRepositoryInterface>()
  const mockedVerifyTokenService = mock<VerifyTokenService>()
  const mockedClockService = mock<ClockServiceInterface>()

  const requestBase: ValidateVerificationTokenApplicationRequestDto = {
    email: email.value,
    purpose: purpose.value,
    token: tokenValue,
  }

  const buildUseCase = () => {
    return new ValidateVerificationToken(mockedTokenRepository, mockedVerifyTokenService, mockedClockService)
  }

  const createVerificationTokenTestBuilder = () => {
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

    mockedClockService.now.mockReturnValue(now)
    mockedVerifyTokenService.verify.mockResolvedValue(true)
  })

  describe('happy path', () => {
    it('should return success when token is valid and correct', async () => {
      const useCase = buildUseCase()
      const verificationToken = createVerificationTokenTestBuilder().build()

      mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)

      const result = await useCase.execute(requestBase)

      expect(mockedTokenRepository.findByEmail).toHaveBeenCalledTimes(1)
      expect(mockedTokenRepository.findByEmail).toHaveBeenCalledWith(email.value)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledTimes(1)
      expect(mockedVerifyTokenService.verify).toHaveBeenCalledWith(verificationToken, tokenValue)

      expect(result).toEqual({
        success: true,
        value: undefined,
      })
    })
  })

  describe('when there are input errors', () => {
    it('should return invalidEmail error when email is not valid', async () => {
      const invalidEmailRequest = { ...requestBase, email: 'invalid-email' }
      const useCase = buildUseCase()

      const result = await useCase.execute(invalidEmailRequest)

      expect(result).toEqual({
        success: false,
        error: ValidateVerificationTokenError.invalidEmail('invalid-email'),
      })

      expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('should return invalidTokenPurpose error when purpose is not valid', async () => {
      const invalidPurposeRequest = { ...requestBase, purpose: 'invalid-purpose' }
      const useCase = buildUseCase()

      const result = await useCase.execute(invalidPurposeRequest)

      expect(result).toEqual({
        success: false,
        error: ValidateVerificationTokenError.invalidTokenPurpose('invalid-purpose'),
      })

      expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('should return invalidTokenFormat error when token format is not valid', async () => {
      const invalidTokenRequest = { ...requestBase, token: 'invalid-format' }
      const useCase = buildUseCase()

      const result = await useCase.execute(invalidTokenRequest)

      expect(result).toEqual({
        success: false,
        error: ValidateVerificationTokenError.invalidTokenFormat(),
      })

      expect(mockedTokenRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('should re-throw exception when VerificationTokenEmail throws a non-domain error', async () => {
      const useCase = buildUseCase()
      const unexpectedError = new Error('Unexpected error during email validation')

      jest.spyOn(VerificationTokenEmail, 'fromString').mockImplementation(() => {
        throw unexpectedError
      })

      await expect(useCase.execute(requestBase)).rejects.toThrow(unexpectedError)
    })

    it('should re-throw exception when VerificationTokenPurpose throws a non-domain error', async () => {
      const useCase = buildUseCase()
      const unexpectedError = new Error('Unexpected error during purpose validation')

      jest.spyOn(VerificationTokenPurpose, 'fromString').mockImplementation(() => {
        throw unexpectedError
      })

      await expect(useCase.execute(requestBase)).rejects.toThrow(unexpectedError)
    })

    it('should re-throw exception when VerificationTokenValue throws a non-domain error', async () => {
      const useCase = buildUseCase()
      const unexpectedError = new Error('Unexpected error during token value validation')

      jest.spyOn(VerificationTokenValue, 'fromString').mockImplementation(() => {
        throw unexpectedError
      })

      await expect(useCase.execute(requestBase)).rejects.toThrow(unexpectedError)
    })
  })

  it('should return notFound error when token does not exist in repository', async () => {
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
    const expiredToken = createVerificationTokenTestBuilder()
      .withExpiresAt(new Date(now.getTime() - 1000))
      .build()

    mockedTokenRepository.findByEmail.mockResolvedValue(expiredToken)

    const result = await useCase.execute(requestBase)

    expect(result).toEqual({
      success: false,
      error: ValidateVerificationTokenError.expired(),
    })

    expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
  })

  it('should return alreadyUsed error when token is already used', async () => {
    const useCase = buildUseCase()
    const usedToken = createVerificationTokenTestBuilder().withUsedAt(now).build()

    mockedTokenRepository.findByEmail.mockResolvedValue(usedToken)

    const result = await useCase.execute(requestBase)

    expect(result).toEqual({
      success: false,
      error: ValidateVerificationTokenError.alreadyUsed(),
    })

    expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
  })

  it('should return invalidOwner error when token email does not match request email', async () => {
    const useCase = buildUseCase()
    const otherEmail = VerificationTokenEmailMother.random()
    const tokenWithOtherEmail = createVerificationTokenTestBuilder().withEmail(otherEmail).build()

    mockedTokenRepository.findByEmail.mockResolvedValue(tokenWithOtherEmail)

    const result = await useCase.execute(requestBase)

    expect(result).toEqual({
      success: false,
      error: ValidateVerificationTokenError.invalidOwner(),
    })

    expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
  })

  it('should return tokenPurposeMismatch error when token purpose does not match request purpose', async () => {
    const useCase = buildUseCase()
    const otherPurpose = VerificationTokenPurpose.resetPassword()
    const tokenWithOtherPurpose = createVerificationTokenTestBuilder().withPurpose(otherPurpose).build()

    mockedTokenRepository.findByEmail.mockResolvedValue(tokenWithOtherPurpose)

    const result = await useCase.execute(requestBase)

    expect(result).toEqual({
      success: false,
      error: ValidateVerificationTokenError.tokenPurposeMismatch(),
    })

    expect(mockedVerifyTokenService.verify).not.toHaveBeenCalled()
  })

  it('should re-throw exception when entity throws a non-domain error (unexpected system error)', async () => {
    const useCase = buildUseCase()
    const verificationToken = createVerificationTokenTestBuilder().build()
    const unexpectedError = new Error('Unexpected error')

    mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)

    jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
      throw unexpectedError
    })

    await expect(useCase.execute(requestBase)).rejects.toThrow(unexpectedError)
  })

  it('should re-throw exception when entity throws a VerificationTokenDomainException that is not mapped in the switch', async () => {
    const useCase = buildUseCase()
    const verificationToken = createVerificationTokenTestBuilder().build()

    mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)

    const unhandledDomainError = VerificationTokenDomainException.invalidTokenHash()

    jest.spyOn(verificationToken, 'validate').mockImplementation(() => {
      throw unhandledDomainError
    })

    await expect(useCase.execute(requestBase)).rejects.toThrow(unhandledDomainError)
  })

  it('should return invalidToken error when cryptographic verification fails', async () => {
    const useCase = buildUseCase()
    const verificationToken = createVerificationTokenTestBuilder().build()

    mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)
    mockedVerifyTokenService.verify.mockResolvedValue(false)

    const result = await useCase.execute(requestBase)

    expect(result).toEqual({
      success: false,
      error: ValidateVerificationTokenError.invalidToken(),
    })
  })

  it('should throw exception when repository throws unexpected error', async () => {
    const useCase = buildUseCase()
    const dbError = new Error('Unexpected verificationTokenRepository error')

    mockedTokenRepository.findByEmail.mockRejectedValue(dbError)

    await expect(useCase.execute(requestBase)).rejects.toThrow(dbError)
  })

  it('should throw exception when verify service throws unexpected error', async () => {
    const useCase = buildUseCase()
    const verificationToken = createVerificationTokenTestBuilder().build()
    const verifyError = new Error('Unexpected verifyTokenService error')

    mockedTokenRepository.findByEmail.mockResolvedValue(verificationToken)
    mockedVerifyTokenService.verify.mockRejectedValue(verifyError)

    await expect(useCase.execute(requestBase)).rejects.toThrow(verifyError)
  })
})
