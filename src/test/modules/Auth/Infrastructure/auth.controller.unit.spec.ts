/* eslint @typescript-eslint/unbound-method: 0 */
import {
  ConflictException,
  GoneException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import {
  AUTH_CLOSE_SESSION_INVALID_SESSION_ID_FORMAT,
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
  AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
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
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
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
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { LogoutUser } from '~/src/modules/Auth/Application/LogoutUser/LogoutUser'
import { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { LogoutUserApplicationError } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationError'
import { GetActiveSessions } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessions'
import { GetActiveSessionsApplicationResponseDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationResponseDto'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { GetActiveSessionsApplicationError } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationError'
import { CloseUserSession } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSession'
import { CloseUserSessionApplicationError } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationError'
import { ClientMetadataApplicationService } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationService'
import { RequestMetadataExtractorInterface } from '~/src/modules/Shared/Infrastructure/Services/RequestMetadataExtractorInterface'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { RefreshTokenMother } from '~/src/test/mothers/Application/RefreshTokenMother'
import { UserApplicationDto } from '~/src/modules/Auth/Application/Dto/UserApplicationDto'

describe('AuthController', () => {
  const mockedResponse = mock<FastifyReply>()
  const mockedConfigService = mock<ConfigService<Env, true>>()
  const mockedLoginUseCase = mock<LoginUser>()
  const mockedGenerateVerificationTokenUseCase = mock<GenerateVerificationToken>()
  const mockedRefreshSessionUseCase = mock<RefreshSession>()
  const mockedValidateVerificationTokenUseCase = mock<ValidateVerificationToken>()
  const mockedCreateUserUseCase = mock<CreateUser>()
  const mockedResetUserPasswordUseCase = mock<ResetUserPassword>()
  const mockedLogoutUserUseCase = mock<LogoutUser>()
  const mockedCloseUserSessionUserCase = mock<CloseUserSession>()
  const mockedGetActiveSessionsUseCase = mock<GetActiveSessions>()
  const mockedRequestMetadataExtractor = mock<RequestMetadataExtractorInterface>()
  const mockedClientMetadataService = mock<ClientMetadataApplicationService>()

  const mockedRawRequestMetadata = { ip: UserIpMother.valid(), userAgent: DeviceInfoMother.validString() }
  const mockedClientMetadata = new ClientMetadataResponseTestBuilder().build()

  const baseDate = new Date('2025-10-13T14:00:00.014Z')

  const authCookiesConfigServiceMockImplementation = createConfigServiceMockImplementation({
    REFRESH_COOKIE_NAME: 'x-refresh-token',
    ACCESS_COOKIE_NAME: 'x-access-token',
    isProduction: false,
  })

  const expectedLoginRefreshResponse = {
    accessToken: 'expected-access-token',
    refreshToken: 'expected-refresh-token',
    accessTokenExpiresAt: new Date(baseDate.getTime() + 1000),
    refreshTokenExpiresAt: new Date(baseDate.getTime() + 10000),
    sessionId: 'expected-session-id',
    userData: { id: 'expected-user-id' } as unknown as UserApplicationDto,
  }

  const assertMetadataFlowWasCalled = (request: FastifyRequest) => {
    expect(mockedRequestMetadataExtractor.extract).toHaveBeenCalledWith(request)
    expect(mockedClientMetadataService.process).toHaveBeenCalledWith(mockedRawRequestMetadata)
  }

  beforeEach(() => {
    mockReset(mockedResponse)
    mockReset(mockedConfigService)
    mockReset(mockedLoginUseCase)
    mockReset(mockedRefreshSessionUseCase)
    mockReset(mockedGenerateVerificationTokenUseCase)
    mockReset(mockedValidateVerificationTokenUseCase)
    mockReset(mockedCreateUserUseCase)
    mockReset(mockedResetUserPasswordUseCase)
    mockReset(mockedLogoutUserUseCase)
    mockReset(mockedCloseUserSessionUserCase)
    mockReset(mockedRequestMetadataExtractor)
    mockReset(mockedClientMetadataService)
    mockReset(mockedGetActiveSessionsUseCase)
  })

  const buildController = () => {
    return new AuthController(
      mockedLoginUseCase,
      mockedRefreshSessionUseCase,
      mockedGenerateVerificationTokenUseCase,
      mockedValidateVerificationTokenUseCase,
      mockedCreateUserUseCase,
      mockedResetUserPasswordUseCase,
      mockedLogoutUserUseCase,
      mockedCloseUserSessionUserCase,
      mockedGetActiveSessionsUseCase,
      mockedRequestMetadataExtractor,
      mockedClientMetadataService,
      mockedConfigService,
    )
  }

  const assertAuthCookiesWereSet = (accessCookieValue: string, refreshCookieValue: string) => {
    expect(mockedConfigService.get).toHaveBeenCalledTimes(3)
    expect(mockedConfigService.get).toHaveBeenCalledWith('isProduction', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('REFRESH_COOKIE_NAME', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('ACCESS_COOKIE_NAME', { infer: true })
    expect(mockedResponse.setCookie).toHaveBeenCalledTimes(2)
    expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-refresh-token', refreshCookieValue, {
      path: '/',
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
      expires: new Date(baseDate.getTime() + 10000),
    })
    expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-access-token', accessCookieValue, {
      path: '/',
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
      expires: new Date(baseDate.getTime() + 1000),
    })
  }

  const assertAuthCookiesWereCleared = () => {
    expect(mockedConfigService.get).toHaveBeenCalledTimes(3)
    expect(mockedConfigService.get).toHaveBeenCalledWith('isProduction', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('REFRESH_COOKIE_NAME', { infer: true })
    expect(mockedConfigService.get).toHaveBeenCalledWith('ACCESS_COOKIE_NAME', { infer: true })
    expect(mockedResponse.clearCookie).toHaveBeenCalledTimes(2)
    expect(mockedResponse.clearCookie).toHaveBeenCalledWith('x-refresh-token', {
      path: '/',
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
    })
    expect(mockedResponse.clearCookie).toHaveBeenCalledWith('x-access-token', {
      path: '/',
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
    })
  }

  describe('login', () => {
    const validEmail = EmailAddressMother.valid().value
    const validPassword = UserPasswordMother.valid().value

    const mockBody = { email: validEmail, password: validPassword }
    const mockRequest = {} as unknown as FastifyRequest

    beforeEach(() => {
      mockedConfigService.get.mockImplementation(authCookiesConfigServiceMockImplementation)
      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedLoginUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedLoginRefreshResponse,
        })
      })

      it('should extract metadata, call use-case correctly, set cookies and return data', async () => {
        const controller = buildController()

        const result = await controller.login(mockRequest, mockBody, mockedResponse)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedLoginUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          clientMetadata: mockedClientMetadata,
        })

        assertAuthCookiesWereSet('expected-access-token', 'expected-refresh-token')
        expect(result).toEqual(expectedLoginRefreshResponse)
      })
    })

    describe('when there are errors', () => {
      const assertAuthCookiesWereNotSet = () => {
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
      }

      it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
        const controller = buildController()
        const useCaseError = LoginUserApplicationError.invalidUserEmail('Invalid email format')

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_EMAIL,
            message: useCaseError.message,
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnprocessableEntityException when use-case returns invalidPasswordFormat error', async () => {
        const controller = buildController()
        const useCaseError = LoginUserApplicationError.invalidPasswordFormat('Invalid password format')

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
            message: useCaseError.message,
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns invalidCredentials error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.invalidCredentials(),
        })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userNotFound(),
        })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns userDisabled error', async () => {
        const controller = buildController()

        mockedLoginUseCase.execute.mockResolvedValue({
          success: false,
          error: LoginUserApplicationError.userDisabled(),
        })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns userDoesNotHaveCredentials error', async () => {
        const controller = buildController()
        const useCaseError = LoginUserApplicationError.userDoesNotHaveCredentials()

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns internalError', async () => {
        const controller = buildController()
        const useCaseError = LoginUserApplicationError.internalError('Unexpected error')

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns revocationFailed', async () => {
        const controller = buildController()
        const useCaseError = LoginUserApplicationError.revocationFailed('Cannot revoke a session')

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns a unknown error', async () => {
        const controller = buildController()
        const unknownUseCaseError = {
          id: 'login_user_unknown_error',
          message: 'Unknown error',
        } as unknown as LoginUserApplicationError

        mockedLoginUseCase.execute.mockResolvedValue({ success: false, error: unknownUseCaseError })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unknownUseCaseError),
        )
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedLoginUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.login(mockRequest, mockBody, mockedResponse)).rejects.toThrow(unexpectedError)
        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })
    })
  })

  describe('refresh', () => {
    const mockRequest = {} as unknown as FastifyRequest
    const mockRefreshToken = RefreshTokenMother.valid()

    const mockedClientMetadata = new ClientMetadataResponseTestBuilder().build()

    beforeEach(() => {
      mockedConfigService.get.mockImplementation(authCookiesConfigServiceMockImplementation)
      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedLoginRefreshResponse,
        })
      })

      it('should extract metadata, call use-case correctly, set cookies and return data', async () => {
        const controller = buildController()

        const result = await controller.refresh(mockRequest, mockedResponse, mockRefreshToken)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedRefreshSessionUseCase.execute).toHaveBeenCalledWith({
          token: mockRefreshToken,
          clientMetadata: mockedClientMetadata,
        })

        assertAuthCookiesWereSet('expected-access-token', 'expected-refresh-token')
        expect(result).toEqual(expectedLoginRefreshResponse)
      })
    })

    describe('when there are errors', () => {
      const assertAuthCookiesWereNotSet = () => {
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
      }

      it('should throw UnauthorizedException when use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.userNotFound(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns userDisabled error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.userDisabled(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns sessionNotFound error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionNotFound(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns sessionAlreadyExpired error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionAlreadyExpired(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnauthorizedException when use-case returns sessionAlreadyRevoked error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.sessionAlreadyRevoked(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenFormat error', async () => {
        const controller = buildController()

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: RefreshSessionApplicationError.invalidTokenFormat(),
        })

        await expect(controller.refresh(mockRequest, mockedResponse, 'invalid-refresh-token')).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_REFRESH_INVALID_TOKEN_FORMAT,
            message: RefreshSessionApplicationError.invalidTokenFormat().message,
          }),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns sessionInconsistency error', async () => {
        const controller = buildController()
        const useCaseError = RefreshSessionApplicationError.sessionInconsistency('Unexpected inconsistency error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns revocationFailed error', async () => {
        const controller = buildController()
        const useCaseError = RefreshSessionApplicationError.revocationFailed('Unexpected revocation error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw InternalServerErrorException when use-case returns internalError error', async () => {
        const controller = buildController()
        const useCaseError = RefreshSessionApplicationError.internalError('Unexpected internal error')

        mockedRefreshSessionUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(
          new InternalServerErrorException(useCaseError),
        )

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })

      it('should throw error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedRefreshSessionUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.refresh(mockRequest, mockedResponse, mockRefreshToken)).rejects.toThrow(unexpectedError)

        assertMetadataFlowWasCalled(mockRequest)
        assertAuthCookiesWereNotSet()
      })
    })
  })

  describe('verify email', () => {
    const mockRequest = {} as unknown as FastifyRequest
    const validEmail = EmailAddressMother.valid()
    const mockBody = { email: validEmail.value, sendNewToken: false }

    beforeEach(() => {
      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      describe('signup', () => {
        it('should extract metadata, call use-case correctly and return undefined', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailCreateAccount(mockRequest, mockBody)

          assertMetadataFlowWasCalled(mockRequest)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.createAccount().value,
            email: mockBody.email,
            sendNewToken: mockBody.sendNewToken,
            clientMetadata: mockedClientMetadata,
          })
          expect(result).toBeUndefined()
        })
      })

      describe('reset', () => {
        it('should extract metadata, call use-case correctly and return undefined', async () => {
          const controller = buildController()

          const result = await controller.verifyEmailResetPassword(mockRequest, mockBody)

          assertMetadataFlowWasCalled(mockRequest)

          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledTimes(1)
          expect(mockedGenerateVerificationTokenUseCase.execute).toHaveBeenCalledWith({
            purpose: VerificationTokenPurpose.resetPassword().value,
            email: mockBody.email,
            sendNewToken: mockBody.sendNewToken,
            clientMetadata: mockedClientMetadata,
          })
          expect(result).toBeUndefined()
        })
      })
    })

    describe('when there are errors', () => {
      const invalidEmail = EmailAddressMother.invalid()
      const mockBodyWithInvalidEmail = { email: invalidEmail, sendNewToken: false }

      describe('signup', () => {
        it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email),
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBodyWithInvalidEmail)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_EMAIL,
              message: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email).message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw UnprocessableEntityException when use-case returns invalidVerificationTokenPurpose error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose'),
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBody)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose').message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw ConflictException when use-case returns activeTokenAlreadyIssued error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(),
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued().message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw ConflictException when use-case returns emailAlreadyTaken error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(),
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
              message: GenerateVerificationTokenApplicationError.emailAlreadyTaken().message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
          const controller = buildController()

          const unknownUseCaseError = {
            message: 'Unknown error',
            id: 'generate_verification_token_unknown_error',
          } as unknown as GenerateVerificationTokenApplicationError

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: unknownUseCaseError,
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBody)).rejects.toThrow(
            new InternalServerErrorException(unknownUseCaseError),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw error when use-case fails unexpectedly', async () => {
          const controller = buildController()
          const unexpectedError = Error('Unexpected error')

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw unexpectedError
          })

          await expect(controller.verifyEmailCreateAccount(mockRequest, mockBody)).rejects.toThrow(unexpectedError)
          assertMetadataFlowWasCalled(mockRequest)
        })
      })

      describe('reset', () => {
        it('should throw UnprocessableEntityException when use-case returns invalidEmail error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email),
          })

          await expect(controller.verifyEmailResetPassword(mockRequest, mockBodyWithInvalidEmail)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_EMAIL,
              message: GenerateVerificationTokenApplicationError.invalidEmail(mockBodyWithInvalidEmail.email).message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw UnprocessableEntityException when use-case returns invalidVerificationTokenPurpose error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose'),
          })

          await expect(controller.verifyEmailResetPassword(mockRequest, mockBody)).rejects.toThrow(
            new UnprocessableEntityException({
              code: AUTH_VERIFY_EMAIL_INVALID_PURPOSE,
              message: GenerateVerificationTokenApplicationError.invalidVerificationTokenPurpose('invalid-purpose').message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw ConflictException when use-case returns activeTokenAlreadyIssued error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(),
          })

          await expect(controller.verifyEmailResetPassword(mockRequest, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
              message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued().message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should return undefined (204 No Content) to obfuscate userNotFound error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.userNotFound(),
          })

          const result = await controller.verifyEmailResetPassword(mockRequest, mockBody)

          expect(result).toBeUndefined()
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should return undefined (204 No Content) to obfuscate userDisabled error', async () => {
          const controller = buildController()

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: GenerateVerificationTokenApplicationError.userDisabled(),
          })

          const result = await controller.verifyEmailResetPassword(mockRequest, mockBody)

          expect(result).toBeUndefined()
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
          const controller = buildController()

          const unknownUseCaseError = {
            message: 'Unknown error',
            id: 'generate_verification_token_unknown_error',
          } as unknown as GenerateVerificationTokenApplicationError

          mockedGenerateVerificationTokenUseCase.execute.mockResolvedValue({
            success: false,
            error: unknownUseCaseError,
          })

          await expect(controller.verifyEmailResetPassword(mockRequest, mockBody)).rejects.toThrow(
            new InternalServerErrorException(unknownUseCaseError),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw error when use-case fails unexpectedly', async () => {
          const controller = buildController()
          const unexpectedError = Error('Unexpected error')

          mockedGenerateVerificationTokenUseCase.execute.mockImplementation(() => {
            throw unexpectedError
          })

          await expect(controller.verifyEmailResetPassword(mockRequest, mockBody)).rejects.toThrow(unexpectedError)
          assertMetadataFlowWasCalled(mockRequest)
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

        const useCaseError = ValidateVerificationTokenError.invalidEmail('Invalid email address')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_EMAIL,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenPurpose error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.invalidTokenPurpose('Invalid token purpose')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns invalidTokenFormat error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.invalidTokenFormat('Invalid token format')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.alreadyUsed('Token has been used')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new ConflictException({
            code: AUTH_VALIDATE_TOKEN_ALREADY_USED,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw GoneException when use-case returns tokenExpired error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.expired('Token has expired')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new GoneException({
            code: AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.tokenPurposeMismatch('Mismatch purpose')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns tokenNotFound error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.notFound()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns invalidOwner error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.invalidOwner('Invalid token owner')

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw NotFoundException when use-case returns invalidCode error', async () => {
        const controller = buildController()

        const useCaseError = ValidateVerificationTokenError.invalidToken()

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({ success: false, error: useCaseError })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(
          new NotFoundException({
            code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
            message: 'Invalid verification token',
          }),
        )
      })

      it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
        const controller = buildController()

        const unknownUseCaseError = {
          message: 'Unknown error',
          id: 'validate_verification_token_unknown_error',
        } as unknown as ValidateVerificationTokenError

        mockedValidateVerificationTokenUseCase.execute.mockResolvedValue({
          success: false,
          error: unknownUseCaseError,
        })

        await expect(controller.verifyToken(mockBody)).rejects.toThrow(new InternalServerErrorException(unknownUseCaseError))
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
    const mockRequest = {} as unknown as FastifyRequest

    const mockBody = {
      email: EmailAddressMother.valid().value,
      username: UserUsernameMother.valid().value,
      name: UserNameMother.valid().value,
      password: UserPasswordMother.valid().value,
      token: VerificationTokenValueMother.valid().value,
      requestedRole: UserRole.sportsman().value,
    }

    beforeEach(() => {
      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedCreateUserUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      it('should extract metadata, call use-case correctly and return nothing', async () => {
        const controller = buildController()

        const result = await controller.signup(mockRequest, mockBody)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedCreateUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedCreateUserUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          clientMetadata: mockedClientMetadata,
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

        await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
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

        assertMetadataFlowWasCalled(mockRequest)
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

        await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
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

        assertMetadataFlowWasCalled(mockRequest)
      }

      describe('when input data is invalid', () => {
        it('should throw UnprocessableEntityException for invalid username', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidUsername('Invalid username'),
            apiCode: AUTH_CREATE_USER_INVALID_USERNAME_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid email', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidEmail('Invalid email address'),
            apiCode: AUTH_CREATE_USER_INVALID_EMAIL_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid password', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidPassword('Invalid password format'),
            apiCode: AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid token format', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidTokenFormat('Invalid token format'),
            apiCode: AUTH_CREATE_USER_INVALID_TOKEN_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid name', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidName('Invalid user name'),
            apiCode: AUTH_CREATE_USER_INVALID_NAME_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid role', async () => {
          await testInvalidInputMapping({
            error: CreateUserError.invalidRole('Invalid user role'),
            apiCode: AUTH_CREATE_USER_INVALID_USER_ROLE,
          })
        })

        it('should throw UnprocessableEntityException for multiple input errors', async () => {
          await testInvalidInputMapping([
            { error: CreateUserError.invalidRole('Invalid user role'), apiCode: AUTH_CREATE_USER_INVALID_USER_ROLE },
            { error: CreateUserError.invalidTokenFormat('Invalid token format'), apiCode: AUTH_CREATE_USER_INVALID_TOKEN_FORMAT },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in invalidInput', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as CreateUserError

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidInput([unknownError]),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
          assertMetadataFlowWasCalled(mockRequest)
        })
      })

      describe('when data is duplicated', () => {
        it('should throw ConflictException mapped for duplicated email', async () => {
          await testDuplicatedMapping({
            error: CreateUserError.duplicatedEmail(),
            apiCode: AUTH_CREATE_USER_DUPLICATED_EMAIL,
          })
        })

        it('should throw ConflictException mapped for duplicated username', async () => {
          await testDuplicatedMapping({
            error: CreateUserError.duplicatedUsername(),
            apiCode: AUTH_CREATE_USER_DUPLICATED_USERNAME,
          })
        })

        it('should throw ConflictException mapped for multiple duplicated errors', async () => {
          await testDuplicatedMapping([
            { error: CreateUserError.duplicatedEmail(), apiCode: AUTH_CREATE_USER_DUPLICATED_EMAIL },
            { error: CreateUserError.duplicatedUsername(), apiCode: AUTH_CREATE_USER_DUPLICATED_USERNAME },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in duplicated', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as CreateUserError

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.duplicated([unknownError]),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
          assertMetadataFlowWasCalled(mockRequest)
        })
      })

      describe('when token is invalid', () => {
        it('should throw NotFoundException when use-case returns notFound error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.notFound(CreateUserError.tokenNotFound()),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw GoneException when use-case returns tokenExpired error', async () => {
          const controller = buildController()
          const specificError = CreateUserError.tokenExpired('Token has already expired')

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(specificError),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new GoneException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
          const controller = buildController()
          const specificError = CreateUserError.tokenAlreadyUsed('Token was already used')

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(specificError),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_CREATE_USER_TOKEN_ALREADY_USED,
              message: specificError.message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.tokenPurposeMismatch('Invalid purpose')),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case returns tokenInvalidOwner error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.tokenInvalidOwner('Invalid owner')),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case return invalidToken error', async () => {
          const controller = buildController()

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(CreateUserError.invalidToken()),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_CREATE_USER_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw InternalServerErrorException when use-case returns an unknown CreateUserError error in invalidToken', async () => {
          const controller = buildController()

          const unknownUseCaseError = {
            id: 'create_user_unknown_error',
            message: 'Unknown error',
          } as unknown as CreateUserError

          mockedCreateUserUseCase.execute.mockResolvedValue({
            success: false,
            error: CreateUserApplicationError.invalidToken(unknownUseCaseError),
          })

          await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(
            new InternalServerErrorException(CreateUserApplicationError.invalidToken(unknownUseCaseError)),
          )
          assertMetadataFlowWasCalled(mockRequest)
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

        await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
        assertMetadataFlowWasCalled(mockRequest)
      })

      it('should throw original error when use-case fails with an unexpected error', async () => {
        const controller = buildController()

        const unexpectedError = new Error('Unexpected error')

        mockedCreateUserUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.signup(mockRequest, mockBody)).rejects.toThrow(unexpectedError)
        assertMetadataFlowWasCalled(mockRequest)
      })
    })
  })

  describe('reset password', () => {
    const mockRequest = {} as unknown as FastifyRequest

    const mockBody = {
      email: EmailAddressMother.valid().value,
      token: VerificationTokenValueMother.valid().value,
      password: UserPasswordMother.valid().value,
    }

    beforeEach(() => {
      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedResetUserPasswordUseCase.execute.mockResolvedValue({ success: true, value: undefined })
      })

      it('should extract metadata, call use-case correctly and return nothing', async () => {
        const controller = buildController()

        const result = await controller.resetPassword(mockRequest, mockBody)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedResetUserPasswordUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedResetUserPasswordUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          clientMetadata: mockedClientMetadata,
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

        await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
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

        assertMetadataFlowWasCalled(mockRequest)
      }

      describe('when input data is invalid', () => {
        it('should throw UnprocessableEntityException for invalid email', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidEmail('Invalid domain email'),
            apiCode: AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid password', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidPassword('Invalid domain password'),
            apiCode: AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for invalid token format', async () => {
          await testInvalidInputMapping({
            error: ResetUserPasswordError.invalidTokenFormat('Invalid domain token format'),
            apiCode: AUTH_RESET_PASSWORD_INVALID_TOKEN_FORMAT,
          })
        })

        it('should throw UnprocessableEntityException for multiple input errors', async () => {
          await testInvalidInputMapping([
            { error: ResetUserPasswordError.invalidEmail('Invalid domain email'), apiCode: AUTH_RESET_PASSWORD_INVALID_EMAIL_FORMAT },
            {
              error: ResetUserPasswordError.invalidPassword('Invalid domain password'),
              apiCode: AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
            },
          ])
        })

        it('should throw InternalServerErrorException when use-case returns an unknown ResetUserPasswordError in invalidInput', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown-id', message: 'Unknown', name: 'Unknown' } as ResetUserPasswordError

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidInput([unknownError]),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
          assertMetadataFlowWasCalled(mockRequest)
        })
      })

      describe('when token is invalid or user not found', () => {
        it('should throw NotFoundException when use-case returns notFound error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.tokenNotFound()),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw GoneException when use-case returns tokenExpired error', async () => {
          const controller = buildController()
          const specificError = ResetUserPasswordError.tokenExpired('Token has already expired')

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(specificError),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new GoneException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_EXPIRED,
              message: specificError.message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw ConflictException when use-case returns tokenAlreadyUsed error', async () => {
          const controller = buildController()
          const specificError = ResetUserPasswordError.tokenAlreadyUsed('Token was already used')

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(specificError),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new ConflictException({
              code: AUTH_RESET_PASSWORD_TOKEN_ALREADY_USED,
              message: specificError.message,
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case returns tokenPurposeMismatch error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenPurposeMismatch('Invalid purpose')),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case returns tokenInvalidOwner error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.tokenInvalidOwner('Invalid owner')),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw NotFoundException when use-case return invalidToken error', async () => {
          const controller = buildController()

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(ResetUserPasswordError.invalidToken()),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
            new NotFoundException({
              code: AUTH_RESET_PASSWORD_INVALID_TOKEN,
              message: 'Invalid verification token',
            }),
          )
          assertMetadataFlowWasCalled(mockRequest)
        })

        it('should throw InternalServerErrorException when use-case returns an unknown ResetUserPasswordError in invalidToken', async () => {
          const controller = buildController()
          const unknownError = { id: 'unknown_token_error', name: 'Unknown', message: 'Unknown' } as ResetUserPasswordError

          mockedResetUserPasswordUseCase.execute.mockResolvedValue({
            success: false,
            error: ResetUserPasswordApplicationError.invalidToken(unknownError),
          })

          await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
          assertMetadataFlowWasCalled(mockRequest)
        })
      })

      it('should throw ConflictException for cannotResetPassword error', async () => {
        const controller = buildController()

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: ResetUserPasswordApplicationError.cannotResetPassword(),
        })

        await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(
          new ConflictException({
            code: AUTH_RESET_PASSWORD_SAME_PASSWORD,
            message: 'New password cannot be the same as the current password',
          }),
        )
        assertMetadataFlowWasCalled(mockRequest)
      })

      it('should throw InternalServerErrorException for inconsistentState error', async () => {
        const controller = buildController()

        mockedResetUserPasswordUseCase.execute.mockResolvedValue({
          success: false,
          error: ResetUserPasswordApplicationError.inconsistentState(),
        })

        await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
        assertMetadataFlowWasCalled(mockRequest)
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

        await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(InternalServerErrorException)
        assertMetadataFlowWasCalled(mockRequest)
      })

      it('should throw original error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedResetUserPasswordUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.resetPassword(mockRequest, mockBody)).rejects.toThrow(unexpectedError)
        assertMetadataFlowWasCalled(mockRequest)
      })
    })
  })

  describe('logout', () => {
    const userId = IdentifierMother.valid()
    const sessionId = IdentifierMother.valid()

    const mockedAccessToken = {
      sub: userId.value,
      sid: sessionId.value,
    } as JwtPayload

    beforeEach(() => {
      mockedResponse.clearCookie.mockReturnThis()
      mockedConfigService.get.mockImplementation(authCookiesConfigServiceMockImplementation)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedLogoutUserUseCase.execute.mockResolvedValue({
          success: true,
          value: undefined,
        })
      })

      it('should call use-case correctly and clear cookies when logout user correctly', async () => {
        const controller = buildController()

        const result = await controller.logout(mockedAccessToken, mockedResponse)

        expect(mockedLogoutUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedLogoutUserUseCase.execute).toHaveBeenCalledWith({
          userId: mockedAccessToken.sub,
          sessionId: mockedAccessToken.sid,
        })

        assertAuthCookiesWereCleared()

        expect(result).toBeUndefined()
      })

      it('should not call use-case and clear cookies when access token is undefined', async () => {
        const controller = buildController()

        const result = await controller.logout(undefined, mockedResponse)

        expect(mockedLogoutUserUseCase.execute).not.toHaveBeenCalled()

        assertAuthCookiesWereCleared()

        expect(result).toBeUndefined()
      })
    })

    describe('when there are errors', () => {
      describe('when errors should be obfuscated', () => {
        const testObfuscatedErrorAndClearCookiesCase = async (error: LogoutUserApplicationError) => {
          const controller = buildController()

          mockedLogoutUserUseCase.execute.mockResolvedValue({ success: false, error })

          const result = await controller.logout(mockedAccessToken, mockedResponse)

          assertAuthCookiesWereCleared()
          expect(mockedLogoutUserUseCase.execute).toHaveBeenCalledTimes(1)

          expect(result).toBeUndefined()
        }

        it('should clear cookies when use-case returns userNotFound error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.userNotFound())
        })

        it('should clear cookies when use-case returns userDisabled error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.userDisabled())
        })

        it('should clear cookies when use-case returns sessionNotFound error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.sessionNotFound())
        })

        it('should clear cookies when use-case returns sessionDoesNotBelongToUser error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.sessionDoesNotBelongToUser())
        })

        it('should clear cookies when use-case returns cannotRevokeSession error', async () => {
          const expectedRevocationError = UserSessionDomainException.sessionAlreadyRevoked()

          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.cannotRevokeSession(expectedRevocationError.message))
        })

        it('should clear cookies when use-case returns invalidUserId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.invalidUserId('Invalid user id'))
        })

        it('should clear cookies when use-case returns invalidSessionId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(LogoutUserApplicationError.invalidSessionId('Invalid session id'))
        })
      })

      it('should throw InternalServerErrorException and do not clean cookies when use-case returns an unknown LogoutUserApplicationError', async () => {
        const controller = buildController()

        const unknownUseCaseError = {
          id: 'revoke_session_unknown_error',
          message: 'Unknown error',
        } as unknown as LogoutUserApplicationError

        mockedLogoutUserUseCase.execute.mockResolvedValue({
          success: false,
          error: unknownUseCaseError,
        })

        await expect(controller.logout(mockedAccessToken, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unknownUseCaseError),
        )

        expect(mockedLogoutUserUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()
      })

      it('should throw original error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedLogoutUserUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.logout(mockedAccessToken, mockedResponse)).rejects.toThrow(unexpectedError)
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()
      })
    })
  })

  describe('closeSession', () => {
    const userId = IdentifierMother.valid()
    const currentSessionId = IdentifierMother.valid()
    const anotherActiveSessionId = IdentifierMother.valid()

    const mockedAccessToken = {
      sub: userId.value,
      sid: currentSessionId.value,
    } as JwtPayload

    const mockRequest = {} as unknown as FastifyRequest

    beforeEach(() => {
      mockedResponse.clearCookie.mockReturnThis()

      mockedRequestMetadataExtractor.extract.mockReturnValue(mockedRawRequestMetadata)
      mockedClientMetadataService.process.mockResolvedValue(mockedClientMetadata)

      mockedConfigService.get.mockImplementation(authCookiesConfigServiceMockImplementation)
    })

    describe('happy path', () => {
      beforeEach(() => {
        mockedCloseUserSessionUserCase.execute.mockResolvedValue({ success: true, value: undefined })
      })

      it('should extract metadata, call use-case correctly and clear cookies when closing the current session', async () => {
        const controller = buildController()

        const result = await controller.closeSession(mockedAccessToken, currentSessionId.value, mockRequest, mockedResponse)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledWith({
          userId: mockedAccessToken.sub,
          sessionId: currentSessionId.value,
          currentSessionId: mockedAccessToken.sid,
          clientMetadata: mockedClientMetadata,
        })

        assertAuthCookiesWereCleared()

        expect(result).toBeUndefined()
      })

      it('should extract metadata, call use-case correctly and NOT clear cookies when closing a different session', async () => {
        const controller = buildController()

        const result = await controller.closeSession(mockedAccessToken, anotherActiveSessionId.value, mockRequest, mockedResponse)

        assertMetadataFlowWasCalled(mockRequest)

        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledWith({
          userId: mockedAccessToken.sub,
          sessionId: anotherActiveSessionId.value,
          currentSessionId: mockedAccessToken.sid,
          clientMetadata: mockedClientMetadata,
        })

        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()

        expect(result).toBeUndefined()
      })
    })

    describe('when there are errors', () => {
      describe('when errors should be obfuscated', () => {
        const testObfuscatedErrorAndClearCookiesCase = async (error: CloseUserSessionApplicationError, targetSessionId: string) => {
          const controller = buildController()

          mockedCloseUserSessionUserCase.execute.mockResolvedValue({ success: false, error })

          const result = await controller.closeSession(mockedAccessToken, targetSessionId, mockRequest, mockedResponse)

          assertAuthCookiesWereCleared()

          expect(result).toBeUndefined()
        }

        const testObfuscatedErrorAndNotClearCookiesCase = async (error: CloseUserSessionApplicationError, targetSessionId: string) => {
          const controller = buildController()

          mockedCloseUserSessionUserCase.execute.mockResolvedValue({ success: false, error })

          const result = await controller.closeSession(mockedAccessToken, targetSessionId, mockRequest, mockedResponse)

          expect(mockedConfigService.get).not.toHaveBeenCalled()
          expect(mockedResponse.clearCookie).not.toHaveBeenCalled()

          expect(result).toBeUndefined()
        }

        it('should clear cookies when closing current session and use-case returns invalidUserId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.invalidUserId('Invalid token'),
            currentSessionId.value,
          )
        })

        it('should clear cookies when closing a different session and use-case returns invalidUserId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.invalidUserId('Invalid token'),
            anotherActiveSessionId.value,
          )
        })

        it('should clear cookies when closing current session and use-case returns invalidCurrentSessionId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.invalidCurrentSessionId('Invalid token'),
            currentSessionId.value,
          )
        })

        it('should clear cookies when closing a different session and use-case returns invalidCurrentSessionId error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.invalidCurrentSessionId('Invalid token'),
            anotherActiveSessionId.value,
          )
        })

        it('should clear cookies when closing current session and use-case returns userNotFound error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(CloseUserSessionApplicationError.userNotFound(), currentSessionId.value)
        })

        it('should clear cookies when closing a different session and use-case returns userNotFound error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(CloseUserSessionApplicationError.userNotFound(), anotherActiveSessionId.value)
        })

        it('should clear cookies when closing current session and use-case returns userDisabled error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(CloseUserSessionApplicationError.userDisabled(), currentSessionId.value)
        })

        it('should clear cookies when closing a different session and use-case returns userDisabled error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(CloseUserSessionApplicationError.userDisabled(), anotherActiveSessionId.value)
        })

        it('should clear cookies when closing current session and use-case returns sessionNotFound error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(CloseUserSessionApplicationError.sessionNotFound(), currentSessionId.value)
        })

        it('should not clear cookies when closing a different session and use-case returns sessionNotFound error', async () => {
          await testObfuscatedErrorAndNotClearCookiesCase(
            CloseUserSessionApplicationError.sessionNotFound(),
            anotherActiveSessionId.value,
          )
        })

        it('should clear cookies when closing current session and use-case returns sessionDoesNotBelongToUser error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.sessionDoesNotBelongToUser(),
            currentSessionId.value,
          )
        })

        it('should not clear cookies when closing a different session and use-case returns sessionDoesNotBelongToUser error', async () => {
          await testObfuscatedErrorAndNotClearCookiesCase(
            CloseUserSessionApplicationError.sessionDoesNotBelongToUser(),
            anotherActiveSessionId.value,
          )
        })

        it('should clear cookies when closing current session and use-case returns cannotRevokeSession error', async () => {
          await testObfuscatedErrorAndClearCookiesCase(
            CloseUserSessionApplicationError.cannotRevokeSession('Session already revoked'),
            currentSessionId.value,
          )
        })

        it('should not clear cookies when closing a different session and use-case returns cannotRevokeSession error', async () => {
          await testObfuscatedErrorAndNotClearCookiesCase(
            CloseUserSessionApplicationError.cannotRevokeSession('Session already revoked'),
            anotherActiveSessionId.value,
          )
        })
      })

      it('should throw UnprocessableEntityException and do not clean cookies when use-case returns invalidSessionId error', async () => {
        const controller = buildController()

        const expectedInputError = CloseUserSessionApplicationError.invalidSessionId('Invalid target session format')

        mockedCloseUserSessionUserCase.execute.mockResolvedValue({
          success: false,
          error: expectedInputError,
        })

        await expect(controller.closeSession(mockedAccessToken, currentSessionId.value, mockRequest, mockedResponse)).rejects.toThrow(
          new UnprocessableEntityException({
            code: AUTH_CLOSE_SESSION_INVALID_SESSION_ID_FORMAT,
            message: expectedInputError.message,
          }),
        )

        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()
      })

      it('should throw InternalServerErrorException and do not clean cookies when use-case returns an unknown CloseSessionApplicationError', async () => {
        const controller = buildController()

        const unknownUseCaseError = {
          id: 'close_session_unknown_error',
          message: 'Unknown error',
        } as unknown as CloseUserSessionApplicationError

        mockedCloseUserSessionUserCase.execute.mockResolvedValue({
          success: false,
          error: unknownUseCaseError,
        })

        await expect(controller.closeSession(mockedAccessToken, currentSessionId.value, mockRequest, mockedResponse)).rejects.toThrow(
          new InternalServerErrorException(unknownUseCaseError),
        )

        expect(mockedCloseUserSessionUserCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()
      })

      it('should throw original error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Unexpected error')

        mockedCloseUserSessionUserCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.closeSession(mockedAccessToken, currentSessionId.value, mockRequest, mockedResponse)).rejects.toThrow(
          unexpectedError,
        )

        expect(mockedConfigService.get).not.toHaveBeenCalled()
        expect(mockedResponse.clearCookie).not.toHaveBeenCalled()
      })
    })
  })

  describe('activeSessions', () => {
    const userId = IdentifierMother.valid()
    const sessionId = IdentifierMother.valid()

    const mockedAccessToken = {
      sub: userId.value,
      sid: sessionId.value,
    } as JwtPayload

    beforeEach(() => {
      mockReset(mockedGetActiveSessionsUseCase)
    })

    describe('happy path', () => {
      it('should call use-case correctly and return the user sessions', async () => {
        const controller = buildController()

        const expectedSessionsResponse = mock<GetActiveSessionsApplicationResponseDto>()

        mockedGetActiveSessionsUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedSessionsResponse,
        })

        const result = await controller.activeSessions(mockedAccessToken)

        expect(mockedGetActiveSessionsUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedGetActiveSessionsUseCase.execute).toHaveBeenCalledWith({
          userId: mockedAccessToken.sub,
          currentSessionId: mockedAccessToken.sid,
        })

        expect(result).toBe(expectedSessionsResponse)
      })
    })

    describe('when there are errors', () => {
      it('should throw InternalServerErrorException when use-case returns invalidInput error', async () => {
        const controller = buildController()

        const expectedInvalidIdentifierException = SharedDomainException.invalidIdentifier(mockedAccessToken.sid)
        const expectedInputError = GetActiveSessionsApplicationError.invalidInput(
          'currentSessionId',
          expectedInvalidIdentifierException.message,
        )

        mockedGetActiveSessionsUseCase.execute.mockResolvedValue({
          success: false,
          error: expectedInputError,
        })

        await expect(controller.activeSessions(mockedAccessToken)).rejects.toThrow(
          new InternalServerErrorException('Validation mismatch: Nest passed the input but domain rejected it', {
            cause: expectedInputError,
          }),
        )

        expect(mockedGetActiveSessionsUseCase.execute).toHaveBeenCalledTimes(1)
      })

      it('should throw InternalServerErrorException when use-case returns an unknown error', async () => {
        const controller = buildController()

        const unknownUseCaseError = {
          message: 'Unknown error',
          id: 'validate_verification_token_unknown_error',
        } as unknown as GetActiveSessionsApplicationError

        mockedGetActiveSessionsUseCase.execute.mockResolvedValue({
          success: false,
          error: unknownUseCaseError,
        })

        await expect(controller.activeSessions(mockedAccessToken)).rejects.toThrow(
          new InternalServerErrorException(unknownUseCaseError),
        )

        expect(mockedGetActiveSessionsUseCase.execute).toHaveBeenCalledTimes(1)
      })

      it('should throw original error when use-case fails with an unexpected exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Database connection failed')

        mockedGetActiveSessionsUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.activeSessions(mockedAccessToken)).rejects.toThrow(unexpectedError)

        expect(mockedGetActiveSessionsUseCase.execute).toHaveBeenCalledTimes(1)
      })
    })
  })
})
