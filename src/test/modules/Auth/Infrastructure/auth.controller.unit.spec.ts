/* eslint @typescript-eslint/unbound-method: 0 */
import { Test, TestingModule } from '@nestjs/testing'
import { HttpStatus } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'
import { LOGIN_USER } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { AuthController } from '~/src/modules/Auth/Infrastructure/auth.controller'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { AUTH_LOGIN_INVALID_EMAIL, AUTH_LOGIN_UNAUTHORIZED } from '~/src/modules/Auth/Infrastructure/ApiCodes'
import { INTERNAL_SERVER_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { mock, mockReset } from 'jest-mock-extended'
import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'

describe('AuthController', () => {
  let controller: AuthController
  let mockedRequest: FastifyRequest = {} as unknown as FastifyRequest

  const mockedResponse = mock<FastifyReply>()
  const mockedUseCase = mock<LoginUser>()

  const base = new Date('2025-10-13T14:00:00.014Z')

  beforeEach(async () => {
    mockReset(mockedResponse)
    mockReset(mockedUseCase)
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LOGIN_USER,
          useValue: mockedUseCase,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)

    mockedRequest = {
      headers: {
        'x-forwarded-for': '123.123.123.123',
        'user-agent': 'LobiApp/1.0 (CarlosP at the controls)',
      },
      ip: '127.0.0.1',
      id: 'test-trace-id',
    } as unknown as FastifyRequest
  })

  describe('login', () => {
    const mockBody = { email: 'test@example.com', password: 'password123' }

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
        mockedUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedResponse,
        })
      })

      it('should call to the use-case correctly when headers includes ip and user-agent', async () => {
        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '123.123.123.123',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
        })
      })

      it('should call to the use-case correctly when headers dont include ip but request does', async () => {
        mockedRequest = {
          headers: {
            'user-agent': 'LobiApp/1.0 (CarlosP at the controls)',
          },
          ip: '127.0.0.1',
          id: 'test-trace-id',
        } as unknown as FastifyRequest

        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '127.0.0.1',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
        })
      })

      it('should call to the use-case correctly when ip and user-agent are not included in the request', async () => {
        mockedRequest = {
          headers: {},
          id: 'test-trace-id',
        } as unknown as FastifyRequest

        await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '',
          userAgent: '',
        })
      })

      it('should set cookies and return correct data', async () => {
        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedUseCase.execute).toHaveBeenCalledWith({
          email: mockBody.email,
          password: mockBody.password,
          ip: '123.123.123.123',
          userAgent: 'LobiApp/1.0 (CarlosP at the controls)',
        })
        expect(mockedResponse.setCookie).toHaveBeenCalledTimes(2)
        expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-refresh-token', 'expected-refresh-token', {
          path: '/',
          sameSite: 'strict',
          secure: false,
          httpOnly: true,
          expires: new Date(base.getTime() + 10000),
        })
        expect(mockedResponse.setCookie).toHaveBeenCalledWith('x-access-token', 'expected-access-token', {
          path: '/',
          sameSite: 'strict',
          secure: false,
          httpOnly: true,
          expires: new Date(base.getTime() + 1000),
        })
        expect(result).toEqual(expectedResponse)
      })
    })

    describe('when there are errors', () => {
      it('should return 422 if use-case returns invalidEmail error', async () => {
        mockedUseCase.execute.mockResolvedValueOnce({
          success: false,
          error: LoginUserApplicationError.invalidUserEmail('test@example.com'),
        })

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedResponse.status).toHaveBeenCalledWith(422)
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
        expect(result).toEqual({
          code: AUTH_LOGIN_INVALID_EMAIL,
          message: LoginUserApplicationError.invalidUserEmail('test@example.com').message,
          status: 422,
          traceId: 'test-trace-id',
        })
      })

      it('should return 401 if use-case return invalidCredentials error', async () => {
        mockedUseCase.execute.mockResolvedValueOnce({
          success: false,
          error: LoginUserApplicationError.invalidCredentials('test-user-id'),
        })

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedResponse.status).toHaveBeenCalledWith(401)
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
        expect(result).toEqual({
          code: AUTH_LOGIN_UNAUTHORIZED,
          message: 'Unauthorized access',
          status: 401,
          traceId: 'test-trace-id',
        })
      })

      it('should return 401 if use-case returns userNotFound error', async () => {
        mockedUseCase.execute.mockResolvedValueOnce({
          success: false,
          error: LoginUserApplicationError.userNotFound('test@example.com'),
        })

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedResponse.status).toHaveBeenCalledWith(401)
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
        expect(result).toEqual({
          code: AUTH_LOGIN_UNAUTHORIZED,
          message: 'Unauthorized access',
          status: 401,
          traceId: 'test-trace-id',
        })
      })

      it('should return 401 if use-case returns userDoesNotHaveCredentials error', async () => {
        mockedUseCase.execute.mockResolvedValueOnce({
          success: false,
          error: LoginUserApplicationError.userDoesNotHaveCredentials('test@example.com'),
        })

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedResponse.status).toHaveBeenCalledWith(401)
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
        expect(result).toEqual({
          code: AUTH_LOGIN_UNAUTHORIZED,
          message: 'Unauthorized access',
          status: 401,
          traceId: 'test-trace-id',
        })
      })

      it('should return 500 if use-case throws', async () => {
        mockedUseCase.execute.mockResolvedValue({
          success: false,
          error: { id: 'UNKNOWN_ERROR_ID', message: 'unknown error', name: 'UnknownError' },
        })

        const result = await controller.login(mockBody, mockedRequest, mockedResponse)

        expect(mockedResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(mockedResponse.setCookie).not.toHaveBeenCalled()
        expect(result).toEqual({
          code: INTERNAL_SERVER_ERROR,
          message: 'Something went wrong while processing your request',
          status: 500,
          traceId: 'test-trace-id',
        })
      })
    })
  })
})
