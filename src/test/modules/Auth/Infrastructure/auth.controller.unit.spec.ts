/* eslint @typescript-eslint/unbound-method: 0 */
import { ConflictException, InternalServerErrorException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import {
  AUTH_LOGIN_INVALID_EMAIL,
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

describe.skip('AuthController', () => {
  let mockedRequest: FastifyRequest = {} as unknown as FastifyRequest

  const mockedResponse = mock<FastifyReply>()
  const mockedConfigService = mock<ConfigService<Env, true>>()
  const mockedLoginUseCase = mock<LoginUser>()
  const mockedGenerateVerificationTokenUseCase = mock<GenerateVerificationToken>()
  const mockedRefreshSessionUseCase = mock<RefreshSession>()

  const base = new Date('2025-10-13T14:00:00.014Z')

  beforeEach(() => {
    mockReset(mockedResponse)
    mockReset(mockedConfigService)
    mockReset(mockedLoginUseCase)
    mockReset(mockedRefreshSessionUseCase)
    mockReset(mockedGenerateVerificationTokenUseCase)
  })

  const buildController = () => {
    return new AuthController(
      mockedLoginUseCase,
      mockedRefreshSessionUseCase,
      mockedGenerateVerificationTokenUseCase,
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
      mockedRequest = {
        headers: {
          'x-forwarded-for': '123.123.123.123',
          'user-agent': 'LobiApp/1.0 (CarlosP at the controls)',
        },
        ip: '127.0.0.1',
        id: 'test-trace-id',
      } as unknown as FastifyRequest

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

      it('should call to the use-case correctly when headers includes ip and user-agent', async () => {
        const controller = buildController()

        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '123.123.123.123',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
        })
      })

      it('should call to the use-case correctly when headers dont include ip but request does', async () => {
        const controller = buildController()

        mockedRequest = {
          headers: {
            'user-agent': 'LobiApp/1.0 (CarlosP at the controls)',
          },
          ip: '127.0.0.1',
          id: 'test-trace-id',
        } as unknown as FastifyRequest

        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '127.0.0.1',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
        })
      })

      it('should call to the use-case correctly when ip and user-agent are not included in the request', async () => {
        const controller = buildController()

        mockedRequest = {
          headers: {},
          id: 'test-trace-id',
        } as unknown as FastifyRequest

        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '',
          userAgent: '',
        })
      })

      it('should set cookies and return correct data', async () => {
        const controller = buildController()

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-refresh-token')
        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '123.123.123.123',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_EMAIL,
            message: LoginUserApplicationError.invalidUserEmail('test@example.com').message,
          }),
        )
      })

      it('should throw UnauthorizedException if use-case returns invalidCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidCredentials('test-user-id'),
        })

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(LoginUserApplicationError.internalError('An unexpected error')),
        )
      })

      it('should throw InternalServerErrorException if use-case returns revocationFailed', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.revocationFailed('Cannot revoke a session'),
        })

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
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

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unexpectedError),
        )
      })

      it('should throw error if use-case fails', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockImplementation(() => {
          throw new Error('Unexpected error')
        })

        await expect(controller.login(mockBody, mockedRequest, mockedResponse)).rejects.toThrow(Error('Unexpected error'))
      })
    })
  })

  describe('refresh', () => {
    beforeEach(() => {
      mockedRequest = {
        cookies: { 'x-refresh-token': 'expected-refresh-token' },
      } as unknown as FastifyRequest

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

      it('should call use-case, set cookies and return the correct data', async () => {
        const controller = buildController()

        const result = await controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')

        loginRefreshAssertCommonCalls('expected-access-token', 'expected-new-refresh-token')
        expect(mockedRefreshSessionUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'expected-refresh-token' })
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
      })

      it('should throw error when use-case fails', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockImplementation(() => {
          throw Error('Unexpected error')
        })

        await expect(controller.refresh(mockedRequest, mockedResponse, 'expected-refresh-token')).rejects.toThrow(
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
        it('should call to use-case correctly', async () => {
          const controller = buildController()

          await controller.verifyEmailCreateAccount(mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.createAccount().toString(),
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
          })
        })
      })

      describe('reset', () => {
        it('should call to use-case correctly', async () => {
          const controller = buildController()

          await controller.verifyEmailResetPassword(mockBody)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.resetPassword().toString(),
            email: mockBody.email,
            language: mockBody.language,
            sendNewToken: mockBody.sendNewToken,
          })
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

          await expect(controller.verifyEmailCreateAccount(mockBodyWithInvalidEmail)).rejects.toThrow(
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

          await expect(controller.verifyEmailCreateAccount(mockBody)).rejects.toThrow(
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
              VerificationTokenPurpose.createAccount().toString(),
            ),
          })

          await expect(controller.verifyEmailCreateAccount(mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
                mockBody.email,
                VerificationTokenPurpose.createAccount().toString(),
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

          await expect(controller.verifyEmailCreateAccount(mockBody)).rejects.toThrow(
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

          await expect(controller.verifyEmailCreateAccount(mockBody)).rejects.toThrow(new InternalServerErrorException(useCaseError))
        })

        it('should throw error when use-case fails', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw Error('Unexpected error')
          })

          await expect(controller.verifyEmailCreateAccount(mockBody)).rejects.toThrow(Error('Unexpected error'))
        })
      })

      describe('reset', () => {
        it('should throw UnprocessableEntityException if use-case returns invalidEmail error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email),
          })

          await expect(controller.verifyEmailResetPassword(mockBodyWithInvalidEmail)).rejects.toThrow(
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

          await expect(controller.verifyEmailResetPassword(mockBody)).rejects.toThrow(
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
              VerificationTokenPurpose.resetPassword().toString(),
            ),
          })

          await expect(controller.verifyEmailResetPassword(mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(
                mockBody.email,
                VerificationTokenPurpose.resetPassword().toString(),
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

          await expect(controller.verifyEmailResetPassword(mockBody)).rejects.toThrow(
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

          await expect(controller.verifyEmailResetPassword(mockBody)).rejects.toThrow(new InternalServerErrorException(useCaseError))
        })

        it('should throw error when use-case fails', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw Error('Unexpected error')
          })

          await expect(controller.verifyEmailResetPassword(mockBody)).rejects.toThrow(Error('Unexpected error'))
        })
      })
    })
  })
})
