import { ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyRequest } from 'fastify'
import { mock, mockReset } from 'jest-mock-extended'
import jwt from 'jsonwebtoken'
import { JwtPayload, JwtPayloadSchema } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { AccessTokenGuard } from '~/src/modules/Auth/Infrastructure/Guards/access-token.guard'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { z, ZodError } from 'zod'

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard
  const mockedConfigService = mock<ConfigService>()
  const mockedExecutionContext = mock<ExecutionContext>()
  const mockedRequest = mock<FastifyRequest>({
    id: 'test-request-id',
    method: 'POST',
    url: 'test-request-url',
  })
  const mockedHttpArgumentsHost = {
    getRequest: jest.fn().mockReturnValue(mockedRequest),
    getResponse: jest.fn(),
    getNext: jest.fn(),
  }

  const ACCESS_SECRET = 'test-secret'
  const ACCESS_ISSUER = 'test-issuer'
  const ACCESS_AUDIENCE = 'test-audience'
  const ACCESS_COOKIE_NAME = 'x-access-token'
  const FAKE_TOKEN = 'fake-jwt-token'
  const validPayload: JwtPayload = {
    sub: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    sid: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  }
  const GENERIC_UNAUTHORIZED_RESPONSE = {
    code: UNAUTHORIZED_ACCESS,
    message: 'Unauthorized access',
  }

  beforeEach(() => {
    mockReset(mockedConfigService)
    mockReset(mockedExecutionContext)
    mockReset(mockedRequest)
    jest.restoreAllMocks()

    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({ ACCESS_SECRET, ACCESS_AUDIENCE, ACCESS_ISSUER, ACCESS_COOKIE_NAME }),
    )

    mockedExecutionContext.switchToHttp.mockReturnValue(mockedHttpArgumentsHost)
    mockedHttpArgumentsHost.getRequest.mockReturnValue(mockedRequest)

    guard = new AccessTokenGuard(mockedConfigService)
  })

  const mockLogger = () => {
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation()
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation()

    return [loggerWarnSpy, loggerErrorSpy]
  }

  it('should throw UnauthorizedException if cookie is missing', () => {
    mockedRequest.cookies = {}

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerWarnSpy).not.toHaveBeenCalled()
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException if jwt verification fails due to invalid signature', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }
    const verifyError = new jwt.JsonWebTokenError('invalid signature')

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw verifyError
    })

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerWarnSpy).toHaveBeenCalledWith('JWT verification failed: invalid signature', {
      requestId: 'test-request-id',
      path: 'test-request-url',
      tokenPrefix: FAKE_TOKEN.substring(0, 10),
    })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException if jwt verification fails due to expired token', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }
    const verifyError = new jwt.TokenExpiredError('jwt expired', new Date())

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw verifyError
    })

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerWarnSpy).toHaveBeenCalledWith('JWT verification failed: Token expired', {
      requestId: 'test-request-id',
      path: 'test-request-url',
      tokenPrefix: FAKE_TOKEN.substring(0, 10),
    })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException and log error for unexpected jwt verification errors', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }
    const unexpectedError = new Error('Unexpected error')

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw unexpectedError
    })

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerErrorSpy).toHaveBeenCalledWith('Unexpected error during JWT verification', expect.any(String), {
      requestId: 'test-request-id',
      path: 'test-request-url',
      tokenPrefix: FAKE_TOKEN.substring(0, 10),
      error: String(unexpectedError),
    })
    expect(loggerWarnSpy).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException and log error for unexpected jwt verification errors (no error)', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }
    const unexpectedError = 'Unexpected error'

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw unexpectedError
    })

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerErrorSpy).toHaveBeenCalledWith('Unexpected error during JWT verification', undefined, {
      requestId: 'test-request-id',
      path: 'test-request-url',
      tokenPrefix: FAKE_TOKEN.substring(0, 10),
      error: String(unexpectedError),
    })
    expect(loggerWarnSpy).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException if Zod payload validation fails', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }
    const invalidPayload = { sub: 'not-a-uuid', iat: 123, exp: 456 }

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      return invalidPayload
    })

    jest.spyOn(JwtPayloadSchema, 'safeParse').mockReturnValue({
      success: false,
      error: {} as ZodError<JwtPayload>,
    })

    const treeifyErrorSpy = jest.spyOn(z, 'treeifyError').mockReturnValue({ errors: ['some-formatted-errors'] })

    expect(() => guard.canActivate(mockedExecutionContext)).toThrow(new UnauthorizedException(GENERIC_UNAUTHORIZED_RESPONSE))
    expect(loggerWarnSpy).toHaveBeenCalledWith('Invalid JWT payload structure', {
      requestId: 'test-request-id',
      path: 'test-request-url',
      tokenPrefix: FAKE_TOKEN.substring(0, 10),
      validationErrors: ['some-formatted-errors'],
      payload: invalidPayload,
    })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(treeifyErrorSpy).toHaveBeenCalledTimes(1)
    expect(treeifyErrorSpy).toHaveBeenCalledWith({})
  })

  it('should return true and attach user payload if token and payload are valid', () => {
    mockedRequest.cookies = { [ACCESS_COOKIE_NAME]: FAKE_TOKEN }

    const [loggerWarnSpy, loggerErrorSpy] = mockLogger()

    const jwtVerifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      return validPayload
    })

    const safeParseSpy = jest.spyOn(JwtPayloadSchema, 'safeParse').mockReturnValue({
      success: true,
      data: validPayload,
    })

    const treeifyErrorSpy = jest.spyOn(z, 'treeifyError').mockReturnValue({ errors: ['some-formatted-errors'] })

    const result = guard.canActivate(mockedExecutionContext)

    expect(jwtVerifySpy).toHaveBeenCalledTimes(1)
    expect(jwtVerifySpy).toHaveBeenCalledWith(FAKE_TOKEN, ACCESS_SECRET, { audience: ACCESS_AUDIENCE, issuer: ACCESS_ISSUER })

    expect(safeParseSpy).toHaveBeenCalledTimes(1)
    expect(safeParseSpy).toHaveBeenCalledWith(validPayload)

    expect(treeifyErrorSpy).not.toHaveBeenCalled()
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(loggerWarnSpy).not.toHaveBeenCalled()

    expect(result).toBe(true)
  })
})
