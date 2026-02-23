/* eslint @typescript-eslint/unbound-method: 0 */
import {
  ConflictException,
  GoneException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import {
  AUTH_CREATE_USER_DUPLICATED_EMAIL,
  AUTH_CREATE_USER_DUPLICATED_USERNAME,
  AUTH_CREATE_USER_INVALID_EMAIL_FORMAT,
  AUTH_CREATE_USER_INVALID_NAME_FORMAT,
  AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
  AUTH_CREATE_USER_INVALID_TOKEN,
  AUTH_CREATE_USER_INVALID_TOKEN_FORMAT,
  AUTH_CREATE_USER_INVALID_USER_ROLE,
  AUTH_CREATE_USER_INVALID_USERNAME_FORMAT,
  AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
  AUTH_CREATE_USER_TOKEN_ALREADY_USED,
  AUTH_LOGIN_INVALID_EMAIL,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_TOKEN,
  AUTH_RESET_PASSWORD_INVALID_TOKEN_FORMAT,
  AUTH_RESET_PASSWORD_SAME_PASSWORD,
  AUTH_RESET_PASSWORD_TOKEN_ALREADY_EXPIRED,
  AUTH_RESET_PASSWORD_TOKEN_ALREADY_USED,
  AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
  AUTH_VALIDATE_TOKEN_ALREADY_USED,
  AUTH_VALIDATE_TOKEN_INVALID_EMAIL,
  AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
  AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
  AUTH_VERIFY_EMAIL_INVALID_EMAIL,
  AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
} from '~/src/modules/Auth/Infrastructure/ApiCodes'
import { mock, mockReset } from 'jest-mock-extended'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { ResetUserPassword } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPassword'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'

describe('AuthController', () => {
  const mockedResponse = mock<FastifyReply>()
  const mockedConfigService = mock<ConfigService<Env, true>>()
  const mockedLoginUseCase = mock<LoginUser>()
  const mockedGenerateVerificationTokenUseCase = mock<GenerateVerificationToken>()
  const mockedRefreshSessionUseCase = mock<RefreshSession>()
  const mockedValidateVerificationTokenUseCase = mock<ValidateVerificationToken>()
  const mockedCreateUserUseCase = mock<CreateUser>()
  const mockedResetUserPasswordUseCase = mock<ResetUserPassword>()

  const mockedIp = '127.0.0.1'
  const mockedUserAgent = UserAgentMother.forTesting().value

  const base = new Date('2025-10-13T14:00:00.014Z')

  beforeEach(() => {
    mockReset(mockedResponse)
    mockReset(mockedConfigService)
    mockReset(mockedLoginUseCase)
    mockReset(mockedRefreshSessionUseCase)
    mockReset(mockedGenerateVerificationTokenUseCase)
    mockReset(mockedValidateVerificationTokenUseCase)
    mockReset(mockedCreateUserUseCase)
    mockReset(mockedResetUserPasswordUseCase)
  })

  const buildController = () => {
    return new AuthController(
      mockedLoginUseCase,
      mockedRefreshSessionUseCase,
      mockedGenerateVerificationTokenUseCase,
      mockedValidateVerificationTokenUseCase,
      mockedCreateUserUseCase,
      mockedResetUserPasswordUseCase,
      mockedConfigService,
    )
  }

  const loginRefreshAssertCommonCalls = (accessCookieValue: string, refreshCookieValue: string) => {
    expect(mockedConfigService.get).toHaveBeenCalledTimes(3)
    expect(mockedConfigService.get).toHaveBeenCalledWith('isProduction', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('REFRESH_COOKIE_NAME', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('ACCESS_COOKIE_NAME', { infer: true })
    expect(mockedResponse.setCookie).toHaveBeenCalledTimes(2)
    expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-refresh-token', refreshCookieValue, {
      path: '/',
      sameSite: 'strict',
      secure: false,
      httpOnly: true,
      expires: new Date(base.getTime() + 10000),
    })
    expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-access-token', accessCookieValue, {
      path: '/',
      sameSite: 'strict',
      secure: false,
      httpOnly: true,
      expires: new Date(base.getTime() + 1000),
    })
  }

  describe('login', () => {
    const validEmail = EmailAddressMother.valid().value
    const validPassword = UserPasswordMother.valid().value

    const mockBody = { email: validEmail, password: validPassword }

    beforeEach(() => {
      mockedConfigService.get.mockImplementation(
        createConfigServiceMockImplementation({
          REFRESH_COOKIE_NAME: 'x-refresh-token',
          ACCESS_COOKIE_NAME: 'x-access-token',
          isProduction: false,
        }),
      )
    })

    describe('happy path', () => {
      const expectedResponse = {
        accessToken: 'expected-access-token',
        refreshToken: 'expected-refresh-token',
        accessTokenExpiresAt: new Date(base.getTime() + 1000),
        refreshTokenExpiresAt: new Date(base.getTime() + 10000),
        sessionId: 'expected-session-id',
        isNewDevice: true,
      }

      beforeEach(() => {
        mockedLoginUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedResponse,
        })
      })

      it('should call use-case correctly passing IP and UserAgent from arguments, set cookie and return data', async () => {
        const controller = buildController()

        await controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-refresh-token')
        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: mockedIp,
          userAgent: mockedUserAgent,
        })
      })

      it('should call use-case correctly when UserAgent is undefined, set cookie and return data', async () => {
        const controller = buildController()

        const result = await controller.login(mockBody, mockedIp, undefined, mockedResponse)

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-refresh-token')
        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: mockedIp,
          userAgent: undefined,
        })

        expect(result).toEqual(expectedResponse)
      })
    })

    describe('when there are errors', () => {
      it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
        const controller = buildController()

        const useCaseError = LoginUserApplicationError.invalidUserEmail(validEmail)

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_EMAIL,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidPasswordFormat error', async () => {
        const controller = buildController()

        const useCaseError = LoginUserApplicationError.invalidPasswordFormat()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns invalidCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(UserIdMother.valid().value),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userNotFound(validEmail),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw InternalServerErrorException when use-case returns userDoesNotHaveCredentials error', async () => {
        const controller = buildController()

        const useCaseError = LoginUserApplicationError.userDoesNotHaveCredentials(validEmail)

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw InternalServerErrorException when use-case returns internalError', async () => {
        const controller = buildController()

        const useCaseError = LoginUserApplicationError.internalError('Unexpected error')

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw InternalServerErrorException when use-case returns revocationFailed', async () => {
        const controller = buildController()

        const useCaseError = LoginUserApplicationError.revocationFailed('Cannot revoke a session')

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw InternalServerErrorException when use-case returns a unknown error', async () => {
        const controller = buildController()

        const unexpectedUseCaseError: LoginUserApplicationError = {
          id: 'UNKNOWN-ERROR',
          message: 'Unknown error',
          name: LoginUserApplicationError.name,
        }

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: unexpectedUseCaseError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unexpectedUseCaseError),
        )
      })

      it('should throw error when use-case fails with a unexpected error', async () => {
        const controller = buildController()

        const unexpectedError = new Error('Unexpected error')

        mockedLoginUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(unexpectedError)
      })
    })
  })

  describe('refresh', () => {
    beforeEach(() => {
      mockedConfigService.get.mockImplementation(
        createConfigServiceMockImplementation({
          REFRESH_COOKIE_NAME: 'x-refresh-token',
          ACCESS_COOKIE_NAME: 'x-access-token',
          isProduction: false,
        }),
      )
    })

    describe('happy path', () => {
      const expectedResponse = {
        accessToken: 'expected-access-token',
        refreshToken: 'expected-new-refresh-token',
        accessTokenExpiresAt: new Date(base.getTime() + 1000),
        refreshTokenExpiresAt: new Date(base.getTime() + 10000),
        sessionId: 'expected-session-id',
      }

      beforeEach(() => {
        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedResponse,
        })
      })

      it('should call use-case correctly passing IP and UserAgent from arguments, set cookie and return data', async () => {
        const controller = buildController()

        const result = await controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-new-refresh-token')
        expect(mockedRefreshSessionUseCase.execute).toHaveBeenCalledWith({
          ip: mockedIp,
          userAgent: mockedUserAgent,
          token: 'expected-refresh-token',
        })
        expect(result).toEqual(expectedResponse)
      })

      it('should call use-case correctly when UserAgent is undefined, set cookie and return data', async () => {
        const controller = buildController()

        const result = await controller.refresh(mockedIp, undefined, mockedResponse, 'expected-refresh-token')

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-new-refresh-token')
        expect(mockedRefreshSessionUseCase.execute).toHaveBeenCalledWith({
          ip: mockedIp,
          userAgent: undefined,
          token: 'expected-refresh-token',
        })
        expect(result).toEqual(expectedResponse)
      })
    })

    describe('when there are errors', () => {
      it('should throw UnauthorizedException when use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.userNotFound('test-user-id'),
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns sessionNotFound error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionNotFound(),
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns sessionAlreadyExpired error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionAlreadyExpired('test-session-id'),
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns sessionAlreadyRevoked error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionAlreadyRevoked('test-session-id'),
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenFormat error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.invalidTokenFormat(),
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'invalid-refresh-token')).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_REFRESH_INVALID_TOKEN_FORMAT,
            message: RefreshSessionApplicationError.invalidTokenFormat().message,
          }),
        )
      })

      it('should throw InternalServerErrorException when use-case returns sessionInconsistency error', async () => {
        const controller = buildController()

        const useCaseError = RefreshSessionApplicationError.sessionInconsistency('Unexpected inconsistency error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw InternalServerErrorException when use-case returns revocationFailed error', async () => {
        const controller = buildController()

        const useCaseError = RefreshSessionApplicationError.revocationFailed('Unexpected revocation error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw InternalServerErrorException when use-case returns internalError error', async () => {
        const controller = buildController()

        const useCaseError = RefreshSessionApplicationError.internalError('Unexpected internal error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw error when use-case fails with an unexpected error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        await expect(controller.refresh(mockedIp, mockedUserAgent, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          Error('Unexpected error'),
        )
      })
    })
  })

  describe('verify email', () => {
    const mockBody = { email: 'test@example.com', sendNewToken: false, language: 'es' }

    describe('happy path', () => {
      beforeEach(() => {
        mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      describe('signup', () => {
        it('should call use-case correctly passing IP and UserAgent from arguments and return data', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.createAccount().value,
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
            ip: mockedIp,
            userAgent: mockedUserAgent,
          })
          expect(result).toBeUndefined()
        })

        it('should call use-case correctly when UserAgent is undefined and return data', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailCreateAccount(mockedIp, undefined, mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.createAccount().value,
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
            ip: mockedIp,
            userAgent: undefined,
          })
          expect(result).toBeUndefined()
        })
      })

      describe('reset', () => {
        it('should call use-case correctly passing IP and UserAgent from arguments and return data', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.resetPassword().value,
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
            ip: mockedIp,
            userAgent: mockedUserAgent,
          })
          expect(result).toBeUndefined()
        })

        it('should call use-case correctly when UserAgent is undefined and return data', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailResetPassword(mockedIp, undefined, mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.resetPassword().value,
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
            ip: mockedIp,
            userAgent: undefined,
          })
          expect(result).toBeUndefined()
        })
      })
    })

    describe('when there are errors', () => {
      const mockBodyWithInvalidEmail = { email: 'invalid-email', sendNewToken: false, language: 'es' }
      const mockBody = { email: 'test@example.com', sendNewToken: false, language: 'es' }

      describe('signup', () => {
        it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email),
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBodyWithInvalidEmail)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_EMAIL,
              message: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email).message,
            }),
          )
        })

        it('should throw UnprocessableEntityException when use-case returns invalidVerificationTokenPurpose error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose'),
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose').message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns activeTokenAlreadyIssued error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
              mockBody.email,
              VerificationTokenPurpose.createAccount().value,
            ),
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
                mockBody.email,
                VerificationTokenPurpose.createAccount().value,
              ).message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns emailAlreadyTaken error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(mockBody.email),
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
              message: GenerateVerificationTokenApplicationError.emailAlreadyTaken(mockBody.email).message,
            }),
          )
        })

        it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
          const controller = buildController()

          const useCaseError: GenerateVerificationTokenApplicationError = {
            message: 'Unknown error',
            id: 'generate_verification_token_unknown_error',
            name: GenerateVerificationTokenApplicationError.name,
          }

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: useCaseError,
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new InternalServerErrorException(useCaseError),
          )
        })

        it('should throw error when use-case fails', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw Error('Unexpected error')
          })

          await expect(controller.verifyEmailCreateAccount(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            Error('Unexpected error'),
          )
        })
      })

      describe('reset', () => {
        it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email),
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBodyWithInvalidEmail)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_EMAIL,
              message: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email).message,
            }),
          )
        })

        it('should throw UnprocessableEntityException when use-case returns invalidVerificationTokenPurpose error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose'),
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose').message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns activeTokenAlreadyIssued error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
              mockBody.email,
              VerificationTokenPurpose.resetPassword().value,
            ),
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
                mockBody.email,
                VerificationTokenPurpose.resetPassword().value,
              ).message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns emailAlreadyTaken error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(mockBody.email),
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
              message: GenerateVerificationTokenApplicationError.emailAlreadyTaken(mockBody.email).message,
            }),
          )
        })

        it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
          const controller = buildController()

          const useCaseError: GenerateVerificationTokenApplicationError = {
            message: 'Unknown error',
            id: 'generate_verification_token_unknown_error',
            name: GenerateVerificationTokenApplicationError.name,
          }

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: useCaseError,
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            new InternalServerErrorException(useCaseError),
          )
        })

        it('should throw error when use-case fails', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw Error('Unexpected error')
          })

          await expect(controller.verifyEmailResetPassword(mockedIp, mockedUserAgent, mockBody)).rejects.toThrow(
            Error('Unexpected error'),
          )
        })
      })
    })
  })

  describe('validate token', () => {
    const mockBody = {
      email: EmailAddressMother.valid().value,
      purpose: VerificationTokenPurpose.createAccount().value,
      token: VerificationTokenValueMother.valid().value,
    }

    describe('happy path', () => {
      beforeEach(() => {
        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      it('should call use-case correctly and return', async () => {
        const controller = buildController()

        const result = await controller.verifyToken(mockBody)

        expect(mockedValidateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedValidateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          purpose: mockBody.purpose,
          token: mockBody.token,
        })
        expect(result).toBeUndefined()
      })
    })

    describe('when there are errors', () => {
      it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.invalidEmail('invalid-email'),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_EMAIL,
            message: ValidateVerificationTokenError.invalidEmail('invalid-email').message,
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenPurpose error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.invalidTokenPurpose('invalid-purpose'),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
            message: ValidateVerificationTokenError.invalidTokenPurpose('invalid-purpose').message,
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenFormat error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.invalidTokenFormat(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
            message: ValidateVerificationTokenError.invalidTokenFormat().message,
          }),
        )
      })

      it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.alreadyUsed(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new ConflictException({
            code: AUTH_VALIDATE_TOKEN_ALREADY_USED,
            message: ValidateVerificationTokenError.alreadyUsed().message,
          }),
        )
      })

      it('should throw GoneException when use-case returns tokenExpired error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.expired(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new GoneException({
            code: AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
            message: ValidateVerificationTokenError.expired().message,
          }),
        )
      })

      it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.tokenPurposeMismatch(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns tokenNotFound error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.notFound(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns invalidOwner error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.invalidOwner(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns invalidCode error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: ValidateVerificationTokenError.invalidToken(),
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
        const controller = buildController()

        const useCaseError: ValidateVerificationTokenError = {
          message: 'Unknown error',
          id: 'validate_verification_token_unknown_error',
          name: ValidateVerificationTokenError.name,
        }

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(new InternalServerErrorException(useCaseError))
      })

      it('should throw InternalServerErrorException when use-case fails with a unexpected error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(Error('Unexpected error'))
      })
    })
  })

  describe('signup', () => {
    const mockBody = {
      email: EmailAddressMother.valid().value,
      username: UserUsernameMother.valid().value,
      name: UserNameMother.valid().value,
      password: UserPasswordMother.valid().value,
      token: VerificationTokenValueMother.valid().value,
      requestedRole: UserRole.sportsman().value,
    }

    describe('happy path', () => {
      beforeEach(() => {
        mockedCreateUserUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      it('should call use-case correctly passing IP and UserAgent and return nothing', async () => {
        const controller = buildController()

        const result = await controller.signup(mockBody, mockedIp, mockedUserAgent)

        expect(mockedCreateUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedCreateUserUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          ip: mockedIp,
          userAgent: mockedUserAgent,
        })
        expect(result).toBeUndefined()
      })

      it('should call use-case correctly when UserAgent is undefined and return nothing', async () => {
        const controller = buildController()

        const result = await controller.signup(mockBody, mockedIp, undefined)

        expect(mockedCreateUserUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          ip: mockedIp,
          userAgent: undefined,
        })
        expect(result).toBeUndefined()
      })
    })

    describe('when there are errors', () => {
      type ErrorWithApiCode = {
        error: CreateUserError
        apiCode: string
      }
      const testInvalidInputMapping = async (errorsWithApiCode: ErrorWithApiCode | Array<ErrorWithApiCode>) => {
        const controller = buildController()

        mockedCreateUserUseCase.execute.mockResolvedValue({
          success: false,
          error: CreateUserApplicationError.invalidInput(
            Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithApiCode) => errorWithApiCode.error)
              : [errorsWithApiCode.error],
          ),
        })

        await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
          new UnprocessableEntityException({
            message: 'One or more fields have invalid formats',
            errors: Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithCode) => ({
                  code: errorWithCode.apiCode,
                  message: errorWithCode.error.message,
                }))
              : [
                  {
                    code: errorsWithApiCode.apiCode,
                    message: errorsWithApiCode.error.message,
                  },
                ],
          }),
        )
      }

      const testDuplicatedMapping = async (errorsWithApiCode: ErrorWithApiCode | Array<ErrorWithApiCode>) => {
        const controller = buildController()

        mockedCreateUserUseCase.execute.mockResolvedValue({
          success: false,
          error: CreateUserApplicationError.duplicated(
            Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithApiCode) => errorWithApiCode.error)
              : [errorsWithApiCode.error],
          ),
        })

        await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
          new ConflictException({
            message: 'Some provided data is already in use',
            errors: Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithCode) => ({
                  code: errorWithCode.apiCode,
                  message: errorWithCode.error.message,
                }))
              : [
                  {
                    code: errorsWithApiCode.apiCode,
                    message: errorsWithApiCode.error.message,
                  },
                ],
          }),
        )
      }

      describe('when input data is invalid', () => {
        it('should throw UnprocessableEntityException for invalid username', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidUsername(), apiCode: AUTH_CREATE_USER_INVALID_USERNAME_FORMAT })
        })

        it('should throw UnprocessableEntityException for invalid email', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidEmail(), apiCode: AUTH_CREATE_USER_INVALID_EMAIL_FORMAT })
        })

        it('should throw UnprocessableEntityException for invalid password', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidPassword(), apiCode: AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT })
        })

        it('should throw UnprocessableEntityException for invalid token format', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidTokenFormat(), apiCode: AUTH_CREATE_USER_INVALID_TOKEN_FORMAT })
        })

        it('should throw UnprocessableEntityException for invalid name', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidName(), apiCode: AUTH_CREATE_USER_INVALID_NAME_FORMAT })
        })

        it('should throw UnprocessableEntityException for invalid role', async () => {
          await testInvalidInputMapping({ error: CreateUserError.invalidRole(), apiCode: AUTH_CREATE_USER_INVALID_USER_ROLE })
        })

        it('should throw UnprocessableEntityException for multiple input errors', async () => {
          await testInvalidInputMapping([
            { error: CreateUserError.invalidRole(), apiCode: AUTH_CREATE_USER_INVALID_USER_ROLE },
            { error: CreateUserError.invalidTokenFormat(), apiCode: AUTH_CREATE_USER_INVALID_TOKEN_FORMAT },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in invalidInput', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as CreateUserError

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidInput([unknownError]),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
        })
      })

      describe('when data is duplicated', () => {
        it('should throw ConflictException mapped for duplicated email', async () => {
          await testDuplicatedMapping({
            error: CreateUserError.duplicatedEmail(mockBody.email),
            apiCode: AUTH_CREATE_USER_DUPLICATED_EMAIL,
          })
        })

        it('should throw ConflictException mapped for duplicated username', async () => {
          await testDuplicatedMapping({
            error: CreateUserError.duplicatedUsername(mockBody.username),
            apiCode: AUTH_CREATE_USER_DUPLICATED_USERNAME,
          })
        })

        it('should throw ConflictException mapped for multiple duplicated errors', async () => {
          await testDuplicatedMapping([
            { error: CreateUserError.duplicatedEmail(mockBody.email), apiCode: AUTH_CREATE_USER_DUPLICATED_EMAIL },
            { error: CreateUserError.duplicatedUsername(mockBody.username), apiCode: AUTH_CREATE_USER_DUPLICATED_USERNAME },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in duplicated', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as CreateUserError

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.duplicated([unknownError]),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
        })
      })

      describe('when token is invalid', () => {
        it('should throw NotFoundException when use-case returns notFound error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.notFound(CreateUserError.tokenNotFound(mockBody.email)),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw GoneException when use-case returns tokenExpired error', async () => {
          const controller = buildController()
          const specificError = CreateUserError.tokenExpired()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(specificError),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new GoneException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
          const controller = buildController()
          const specificError = CreateUserError.tokenAlreadyUsed()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(specificError),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new ConflictException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_USED,
              message: specificError.message,
            }),
          )
        })

        it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch()),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw NotFoundException when use-case returns tokenInvalidOwner error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner()),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw NotFoundException when use-case return invalidToken error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in invalidToken', async () => {
          const controller = buildController()

          const useCaseError: CreateUserError = {
            id: 'create_user_unknown_error',
            name: CreateUserError.name,
            message: 'Unknown error',
          }

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(useCaseError),
          })

          await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
        })
      })

      it('should throw InternalServerErrorException when use-case returns an unknown CreateUserApplicationError error', async () => {
        const controller = buildController()

        const useCaseApplicationError: CreateUserApplicationError = {
          id: 'create_user_application_unknown_error',
          name: CreateUserApplicationError.name,
          errors: [],
        }

        mockedCreateUserUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseApplicationError,
        })

        await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
      })

      it('should throw original error when use-case fails with a unexpected error', async () => {
        const controller = buildController()

        const unexpectedError = new Error('Unexpected error')

        mockedCreateUserUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.signup(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(unexpectedError)
      })
    })
  })

  describe('reset password', () => {
    const mockBody = {
      email: EmailAddressMother.valid().value,
      token: VerificationTokenValueMother.valid().value,
      password: UserPasswordMother.valid().value,
    }

    beforeEach(() => {
      mockReset(mockedResetUserPasswordUseCase)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      it('should call use-case correctly passing IP and UserAgent and return nothing', async () => {
        const controller = buildController()

        const result = await controller.resetPassword(mockBody, mockedIp, mockedUserAgent)

        expect(mockedResetUserPasswordUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedResetUserPasswordUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          ip: mockedIp,
          userAgent: mockedUserAgent,
        })
        expect(result).toBeUndefined()
      })

      it('should call use-case correctly when UserAgent is undefined and return nothing', async () => {
        const controller = buildController()

        const result = await controller.resetPassword(mockBody, mockedIp, undefined)

        expect(mockedResetUserPasswordUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          ip: mockedIp,
          userAgent: undefined,
        })
        expect(result).toBeUndefined()
      })
    })

    describe('when there are errors', () => {
      type ErrorWithApiCode = {
        error: ResetUserPasswordError
        apiCode: string
      }

      const testInvalidInputMapping = async (errorsWithApiCode: ErrorWithApiCode | Array<ErrorWithApiCode>) => {
        const controller = buildController()

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: ResetUserPasswordApplicationError.invalidInput(
            Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithApiCode) => errorWithApiCode.error)
              : [errorsWithApiCode.error],
          ),
        })

        await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
          new UnprocessableEntityException({
            message: 'One or more fields have invalid formats',
            errors: Array.isArray(errorsWithApiCode)
              ? errorsWithApiCode.map((errorWithCode) => ({
                  code: errorWithCode.apiCode,
                  message: errorWithCode.error.message,
                }))
              : [
                  {
                    code: errorsWithApiCode.apiCode,
                    message: errorsWithApiCode.error.message,
                  },
                ],
          }),
        )
      }

      describe('when input data is invalid', () => {
        it('should throw UnprocessableEntityException for invalid email', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidEmail(),
            apiCode: AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid password', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidPassword(),
            apiCode: AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid token format', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidTokenFormat(),
            apiCode: AUTH_RESET_PASSWORD_INVALID_TOKEN_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for multiple input errors', async () => {
          await testInvalidInputMapping([
            { error: ResetUserPasswordError.invalidEmail(), apiCode: AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT },
            { error: ResetUserPasswordError.invalidPassword(), apiCode: AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown ResetUserPasswordError in invalidInput', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as ResetUserPasswordError

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidInput([unknownError]),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
        })
      })

      describe('when token is invalid or user not found', () => {
        it('should throw NotFoundException when use-case returns notFound error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.tokenNotFound(mockBody.email)),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw GoneException when use-case returns tokenExpired error', async () => {
          const controller = buildController()
          const specificError = ResetUserPasswordError.tokenExpired()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(specificError),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new GoneException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            }),
          )
        })

        it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
          const controller = buildController()
          const specificError = ResetUserPasswordError.tokenAlreadyUsed()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(specificError),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new ConflictException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_USED,
              message: specificError.message,
            }),
          )
        })

        it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenPurposeMismatch()),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw NotFoundException when use-case returns tokenInvalidOwner error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenInvalidOwner()),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw NotFoundException when use-case return invalidToken error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.invalidToken()),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
        })

        it('should throw InternalServerErrorException when use-case returns an unknown ResetUserPasswordError in invalidToken', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown_token_error', name: 'Unknown', message: 'Unknown' } as ResetUserPasswordError

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(unknownError),
          })

          await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
        })
      })

      it('should throw ConflictException for cannotResetPassword error', async () => {
        const controller = buildController()

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: ResetUserPasswordApplicationError.cannotResetPassword(),
        })

        await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(
          new ConflictException({
            code: AUTH_RESET_PASSWORD_SAME_PASSWORD,
            message: 'New password cannot be the same as the current password',
          }),
        )
      })

      it('should throw InternalServerErrorException for inconsistentState error', async () => {
        const controller = buildController()

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: ResetUserPasswordApplicationError.inconsistentState(UserIdMother.valid().value),
        })

        await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
      })

      it('should throw InternalServerErrorException when use-case returns an unknown ResetUserPasswordApplicationError', async () => {
        const controller = buildController()

        const useCaseApplicationError: ResetUserPasswordApplicationError = {
          id: 'reset_password_application_unknown_error',
          name: ResetUserPasswordApplicationError.name,
          errors: [],
        } as unknown as ResetUserPasswordApplicationError

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseApplicationError,
        })

        await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(InternalServerErrorException)
      })

      it('should throw original error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedResetUserPasswordUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.resetPassword(mockBody, mockedIp, mockedUserAgent)).rejects.toThrow(unexpectedError)
      })
    })
  })
})
