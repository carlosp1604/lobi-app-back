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
  AUTH_LOGIN_INVALID_EMAIL,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
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
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'

describe('AuthController', () => {
  const mockedResponse = mock<FastifyReply>()
  const mockedConfigService = mock<ConfigService<Env, true>>()
  const mockedLoginUseCase = mock<LoginUser>()
  const mockedGenerateVerificationTokenUseCase = mock<GenerateVerificationToken>()
  const mockedRefreshSessionUseCase = mock<RefreshSession>()
  const mockedValidateVerificationTokenUseCase = mock<ValidateVerificationToken>()

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
  })

  const buildController = () => {
    return new AuthController(
      mockedLoginUseCase,
      mockedRefreshSessionUseCase,
      mockedGenerateVerificationTokenUseCase,
      mockedValidateVerificationTokenUseCase,
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
    const mockBody = { email: 'test@example.com', password: 'password123' }

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
      it('should throw UnprocessableEntityException if use-case returns invalidEmail error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidUserEmail('test@example.com'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_EMAIL,
            message: LoginUserApplicationError.invalidUserEmail('test@example.com').message,
          }),
        )
      })

      it('should throw UnprocessableEntityException if use-case returns invalidPasswordFormat error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidPasswordFormat(),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
            message: LoginUserApplicationError.invalidPasswordFormat().message,
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns invalidCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidCredentials('test-user-id'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userNotFound('test@example.com'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns userDoesNotHaveCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials('test@example.com'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns userDoesNotHaveCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials('test@example.com'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns userDoesNotHaveCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials('test@example.com'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw InternalServerErrorException if use-case returns internalError', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.internalError('An unexpected error'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(LoginUserApplicationError.internalError('An unexpected error')),
        )
      })

      it('should throw InternalServerErrorException if use-case returns revocationFailed', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.revocationFailed('Cannot revoke a session'),
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(LoginUserApplicationError.revocationFailed('Cannot revoke a session')),
        )
      })

      it('should throw InternalServerErrorException if use-case returns an unknown error', async () => {
        const controller = buildController()

        const unexpectedError: LoginUserApplicationError = {
          id: 'UNKNOWN-ERROR',
          message: 'Unknown error',
          name: LoginUserApplicationError.name,
        }
        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: unexpectedError,
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unexpectedError),
        )
      })

      it('should throw error if use-case fails with an unexpected error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockImplementation(() => {
          throw new Error('Unexpected error')
        })

        await expect(controller.login(mockBody, mockedIp, mockedUserAgent, mockedResponse)).rejects.toThrow(Error('Unexpected error'))
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

      it('should throw UnprocessableEntityException if use-case returns invalidTokenFormat error', async () => {
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
        it('should throw UnprocessableEntityException if use-case returns invalidEmail error', async () => {
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

        it('should throw UnprocessableEntityException if use-case returns invalidVerificationTokenPurpose error', async () => {
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

        it('should throw ConflictException if use-case returns activeTokenAlreadyIssued error', async () => {
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

        it('should throw ConflictException if use-case returns emailAlreadyTaken error', async () => {
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
        it('should throw UnprocessableEntityException if use-case returns invalidEmail error', async () => {
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

        it('should throw UnprocessableEntityException if use-case returns invalidVerificationTokenPurpose error', async () => {
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

        it('should throw ConflictException if use-case returns activeTokenAlreadyIssued error', async () => {
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

        it('should throw ConflictException if use-case returns emailAlreadyTaken error', async () => {
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
      email: VerificationTokenEmailMother.valid().value,
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
      it('should throw UnprocessableEntityException if use-case returns invalidEmail error', async () => {
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

      it('should throw UnprocessableEntityException if use-case returns invalidTokenPurpose error', async () => {
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

      it('should throw UnprocessableEntityException if use-case returns invalidTokenFormat error', async () => {
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

      it('should throw ConflictException if use-case returns tokenAlreadyUsed error', async () => {
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

      it('should throw GoneException if use-case returns tokenExpired error', async () => {
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

      it('should throw NotFoundException if use-case returns tokenPurposeMismatch error', async () => {
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

      it('should throw NotFoundException if use-case returns tokenNotFound error', async () => {
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

      it('should throw NotFoundException if use-case returns invalidOwner error', async () => {
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

      it('should throw NotFoundException if use-case returns invalidCode error', async () => {
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

      it('should throw InternalServerErrorException if use-case returns an unknown error', async () => {
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

      it('should throw error when use-case fails with unexpected error', async () => {
        const controller = buildController()

        mockedValidateVerificationTokenUseCase.execute.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(Error('Unexpected error'))
      })
    })
  })
})
