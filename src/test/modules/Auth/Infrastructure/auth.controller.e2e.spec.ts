import { DataSource } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserCredentialRawWitRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import request from 'supertest'
import { DatabaseModule } from '~/src/db/database.module'
import { LoggerModule } from '~/src/modules/Shared/Infrastructure/logger.module'
import { RateLimitModule } from '~/src/modules/Shared/Infrastructure/rate-limit.module'
import { SharedModule } from '~/src/modules/Shared/Infrastructure/shared.module'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import fastifyCookie from '@fastify/cookie'
import { validationPipe } from '~/src/modules/Shared/Infrastructure/global-validation.pipe'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { SentryExceptionFilter } from '~/src/modules/Shared/Infrastructure/sentry-exception.filter'
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED_ACCESS, VALIDATION_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import {
  CLIENT_METADATA_SERVICE,
  EMAIL_SENDER_SERVICE,
  HASHER_SERVICE,
  PASSWORD_HASHER_SERVICE,
  TOKEN_GENERATOR,
} from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import {
  AUTH_CREATE_USER_DUPLICATED_DATA,
  AUTH_CREATE_USER_INVALID_INPUT,
  AUTH_CREATE_USER_INVALID_TOKEN,
  AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
  AUTH_CREATE_USER_TOKEN_ALREADY_USED,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT,
  AUTH_RESET_PASSWORD_INVALID_TOKEN,
  AUTH_RESET_PASSWORD_SAME_PASSWORD,
  AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
  AUTH_VALIDATE_TOKEN_ALREADY_USED,
  AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
  AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
  AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
  AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
} from '~/src/modules/Auth/Infrastructure/ApiCodes'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { expectIsoDate, expectStringOrNull } from '~/src/test/utils/matchers'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'
import { CreateUserApplicationError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { ContextModule } from '~/src/modules/Shared/Infrastructure/context.module'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'
import { RefreshTokenMother } from '~/src/test/mothers/Application/RefreshTokenMother'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { ClientMetadataApplicationService } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationService'
import { mock } from 'jest-mock-extended'

import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { GetUserSecurityDetailsQueryResponseDto } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryResponseDto'

describe('AuthController', () => {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const pastDate = new Date(now.getTime() - 3600 * 1000)

  let app: NestFastifyApplication
  let dataSource: DataSource
  let configService: ConfigService<Env, true>

  /* Third-party dependent service */
  const mockedEmailSenderService = mock<EmailSenderServiceInterface>({
    sendWithTemplate: jest.fn().mockResolvedValue(undefined),
  })

  /* Third-party dependent service */
  const mockedClientMetadataService = mock<ClientMetadataApplicationService>({
    process: jest.fn().mockResolvedValue({
      deviceInfo: DeviceInfoMother.valid(),
      userIpHash: UserIpHashMother.valid(),
      deviceLocation: DeviceLocationMother.valid(),
    }),
  })

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    dataSource = global.dataSource

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [SentryExceptionFilter],
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
          load: [() => env],
        }),
        ContextModule,
        LoggerModule,
        RateLimitModule,
        SharedModule,
        DatabaseModule,
        AuthModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideProvider(CLIENT_METADATA_SERVICE)
      .useValue(mockedClientMetadataService)
      .overrideProvider(EMAIL_SENDER_SERVICE)
      .useValue(mockedEmailSenderService)
      .compile()

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    app.useGlobalPipes(validationPipe)
    app.useGlobalFilters(app.get(SentryExceptionFilter))
    await app.register(fastifyCookie)
    await app.init()

    await app.getHttpAdapter().getInstance().ready()

    configService = app.get(ConfigService)
  })

  afterEach(async () => {
    jest.clearAllMocks()

    const entities = dataSource.entityMetadatas
    const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ')

    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`)
  })

  afterAll(async () => {
    await app.close()
  })

  const checkAuthCookiesWereSet = (cookies: Array<string>) => {
    const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })
    const refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

    expect(cookies).toBeDefined()
    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining(`${accessCookieName}=`), expect.stringContaining(`${refreshCookieName}=`)]),
    )

    const isBeingCleared = cookies.some((cookie) => cookie.includes('Max-Age=0'))
    expect(isBeingCleared).toBe(false)
  }

  const checkAuthCookiesWereCleared = (cookies: Array<string>) => {
    const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })
    const refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

    expect(cookies).toBeDefined()

    const isAccessCookieCleared = cookies.some((cookie) => cookie.includes(`${accessCookieName}=;`) && cookie.includes('Max-Age=0'))
    const isRefreshCookieCleared = cookies.some((cookie) => cookie.includes(`${refreshCookieName}=;`) && cookie.includes('Max-Age=0'))

    expect(isAccessCookieCleared).toBe(true)
    expect(isRefreshCookieCleared).toBe(true)
  }

  const checkAuthCookiesWereNotCleared = (cookies?: Array<string>) => {
    if (!cookies || cookies.length === 0) {
      expect(cookies ?? []).not.toContain('Max-Age=0')
      return
    }

    const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })
    const refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

    const isAccessCookieCleared = cookies.some((cookie) => cookie.includes(`${accessCookieName}=;`) && cookie.includes('Max-Age=0'))
    const isRefreshCookieCleared = cookies.some((cookie) => cookie.includes(`${refreshCookieName}=;`) && cookie.includes('Max-Age=0'))

    expect(isAccessCookieCleared).toBe(false)
    expect(isRefreshCookieCleared).toBe(false)
  }

  describe('login', () => {
    const userId = IdentifierMother.valid().value
    const userEmail = EmailAddressMother.random().value
    const userPassword = UserPasswordMother.valid().value

    let userDatabaseHelper: UserDatabaseHelper
    let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper
    let rawUser: UserRawModelWithRelations
    let rawCredential: UserCredentialRawWitRelationships

    beforeEach(async () => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)

      const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER_SERVICE)
      const passwordHash = await passwordHasher.hash(userPassword)

      rawCredential = makeRawUserCredential({
        user_id: userId,
        locked_until: null,
        last_login_at: null,
        failed_attempts: 0,
        password_hash: passwordHash,
      })

      rawUser = makeRawUser({
        id: userId,
        email: userEmail,
        status: UserStatus.active().value,
      })
    })

    describe('happy path', () => {
      it('should return 200 when user is authenticated correctly', async () => {
        await userDatabaseHelper.save(rawUser)
        await userCredentialDatabaseHelper.save(rawCredential)

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail, password: userPassword })
          .expect(200)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          sessionId: expect.any(String),
          accessTokenExpiresAt: expectIsoDate,
          refreshTokenExpiresAt: expectIsoDate,
          userData: expect.objectContaining<Record<string, unknown>>({
            id: expect.any(String),
            name: expect.any(String),
            username: expect.any(String),
            imageUrl: expectStringOrNull,
          }),
        } as Record<string, unknown>)

        const cookies = response.headers['set-cookie'] as unknown as Array<string>
        checkAuthCookiesWereSet(cookies)

        const savedSession = await userSessionDatabaseHelper.findById(response.body.sessionId as string)
        expect(savedSession).toBeDefined()
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error when body is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ page: 5, perPage: 12 })
          .expect(400)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                path: '/auth/login',
                response: {
                  code: VALIDATION_ERROR,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  errors: expect.any(Object),
                },
                statusCode: 400,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              }),
            )

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const errorMessages = Object.keys(response.body.response.errors).join(' ')

            expect(errorMessages).toContain('email')
            expect(errorMessages).toContain('password')
            expect(errorMessages).toContain('page')
            expect(errorMessages).toContain('perPage')
          })
      })

      it('should throw UnprocessableEntityException when password format is not valid', async () => {
        const expectedDomainErrorMessage = UserCredentialDomainException.invalidPasswordFormat().message
        const invalidPassword = UserPasswordMother.invalid()

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail, password: invalidPassword })
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/login',
              response: {
                code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
                message: LoginUserApplicationError.invalidPasswordFormat(expectedDomainErrorMessage).message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      describe('when endpoint throws UnauthorizedException', () => {
        const testCase = async (password: string) => {
          return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userEmail, password })
            .expect(401)
            .expect((response) => {
              expect(response.body).toEqual({
                path: '/auth/login',
                response: {
                  code: UNAUTHORIZED_ACCESS,
                  message: 'Unauthorized access',
                },
                statusCode: 401,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              } as Record<string, unknown>)
            })
        }

        it('should throw UnauthorizedException when user is not found', async () => {
          await testCase(userPassword)
        })

        it('should throw UnauthorizedException when user is deleted', async () => {
          await userDatabaseHelper.save({ ...rawUser, deleted_at: now })

          await testCase(userPassword)
        })

        it('should throw UnauthorizedException when user is not active', async () => {
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase(userPassword)
        })

        it('should throw UnauthorizedException when user password does not match', async () => {
          await userDatabaseHelper.save(rawUser)
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase(UserPasswordMother.random().value)
        })
      })

      it('should throw InternalServerErrorException when user does not have credentials', async () => {
        await userDatabaseHelper.save(rawUser)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail, password: userPassword })
          .expect(500)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/login',
              response: {
                code: INTERNAL_SERVER_ERROR,
                message: 'Something went wrong while processing your request',
              },
              statusCode: 500,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })
    })
  })

  describe('refresh', () => {
    let refreshCookieName: string

    const userId = IdentifierMother.valid()
    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCurrentSession: UserSessionRawWithRelationships
    let inputToken: string
    let differentInputToken: string

    beforeEach(async () => {
      refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)

      const tokenGeneratorService = await app.resolve<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)
      const hasherService = await app.resolve<HasherServiceInterface>(HASHER_SERVICE)
      inputToken = await tokenGeneratorService.generateSessionToken()
      differentInputToken = await tokenGeneratorService.generateSessionToken()

      const hashedToken = await hasherService.hash(inputToken)

      rawUser = makeRawUser({
        id: userId.value,
        status: UserStatus.active().value,
      })

      rawCurrentSession = makeRawSession({
        user_id: userId.value,
        revoked_at: null,
        expires_at: futureDate,
        token_hash: hashedToken,
      })
    })

    describe('happy path', () => {
      it('should return 200 when session is successfully refreshed', async () => {
        await userDatabaseHelper.save(rawUser)
        await userSessionDatabaseHelper.save(rawCurrentSession)

        const response = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', `${refreshCookieName}=${inputToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual<Record<string, unknown>>({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          sessionId: expect.any(String),
          accessTokenExpiresAt: expectIsoDate,
          refreshTokenExpiresAt: expectIsoDate,
          userData: expect.objectContaining<Record<string, unknown>>({
            id: expect.any(String),
            name: expect.any(String),
            username: expect.any(String),
            imageUrl: expectStringOrNull,
          }),
        })
        checkAuthCookiesWereSet(response.headers['set-cookie'] as unknown as Array<string>)

        const savedSession = await userSessionDatabaseHelper.findById(response.body.sessionId as string)
        expect(savedSession).toBeDefined()
      })
    })

    describe('when there are errors', () => {
      describe('when endpoint return UnauthorizedException', () => {
        const testCase = async (cookie: string) => {
          return request(app.getHttpServer())
            .post('/auth/refresh')
            .set('Cookie', cookie)
            .expect(401)
            .expect((response) => {
              expect(response.body).toEqual({
                path: '/auth/refresh',
                response: {
                  code: UNAUTHORIZED_ACCESS,
                  message: 'Unauthorized access',
                },
                statusCode: 401,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              } as Record<string, unknown>)
            })
        }

        it('should throw UnauthorizedException when request does not include refresh token', async () => {
          await testCase('')
        })

        it('should throw UnauthorizedException when session is not found', async () => {
          await userDatabaseHelper.save(rawUser)

          await testCase(`${refreshCookieName}=${differentInputToken}`)
        })

        it('should throw UnauthorizedException when user is not active', async () => {
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })
          await userSessionDatabaseHelper.save(rawCurrentSession)

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should throw UnauthorizedException when user associated is deleted', async () => {
          await userDatabaseHelper.save({ ...rawUser, deleted_at: now })
          await userSessionDatabaseHelper.save(rawCurrentSession)

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should throw UnauthorizedException when session is already expired', async () => {
          await userDatabaseHelper.save(rawUser)
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: pastDate, revoked_at: null })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should throw UnauthorizedException when session is already revoked', async () => {
          await userDatabaseHelper.save(rawUser)
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: futureDate, revoked_at: now })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })
      })

      it('should throw UnprocessableEntityException when token format is not valid', async () => {
        const invalidTokenFormat = RefreshTokenMother.invalidFormat()

        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `${refreshCookieName}=${invalidTokenFormat}`)
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/refresh',
              response: {
                code: AUTH_REFRESH_INVALID_TOKEN_FORMAT,
                message: RefreshSessionApplicationError.invalidTokenFormat().message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })
    })
  })

  describe('verify email', () => {
    const userEmail = EmailAddressMother.random()
    let userDatabaseHelper: UserDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCurrentVerificationToken: VerificationTokenRawModel

    const body = { email: userEmail.value, sendNewToken: false }

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)

      rawUser = makeRawUser({
        email: userEmail.value,
        status: UserStatus.active().value,
        deleted_at: null,
      })

      rawCurrentVerificationToken = makeRawVerificationToken({
        email: userEmail.value,
        purpose: VerificationTokenPurpose.createAccount().value,
        expires_at: futureDate,
        used_at: null,
        token_hash: VerificationTokenTokenHashMother.random().value,
      })
    })

    describe('happy path', () => {
      it('should return 204 for signup when user does not exist', async () => {
        const result = await request(app.getHttpServer()).post('/auth/verify-email/signup').send(body)

        expect(result.status).toBe(204)

        const savedVerificationToken = await verificationTokenDatabaseHelper.findByEmail(body.email)
        expect(savedVerificationToken).toHaveLength(1)
      })

      it('should return 204 for reset password when user exists', async () => {
        await userDatabaseHelper.save(rawUser)

        const result = await request(app.getHttpServer()).post('/auth/verify-email/reset').send(body)

        expect(result.status).toBe(204)

        const savedVerificationToken = await verificationTokenDatabaseHelper.findByEmail(body.email)
        expect(savedVerificationToken).toHaveLength(1)
      })

      it('should return 204 when user does not exist for reset password', async () => {
        const result = await request(app.getHttpServer()).post('/auth/verify-email/reset').send(body)

        expect(result.status).toBe(204)

        const savedVerificationToken = await verificationTokenDatabaseHelper.findByEmail(body.email)
        expect(savedVerificationToken).toHaveLength(0)
      })

      it('should return 204 when user is not active for reset password', async () => {
        await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })

        const result = await request(app.getHttpServer()).post('/auth/verify-email/reset').send(body)

        expect(result.status).toBe(204)

        const savedVerificationToken = await verificationTokenDatabaseHelper.findByEmail(body.email)
        expect(savedVerificationToken).toHaveLength(0)
      })
    })

    describe('when there are errors', () => {
      describe('when body is not valid', () => {
        const testCase = async (path: string) => {
          return request(app.getHttpServer())
            .post(path)
            .send({ page: 5, perPage: 12 })
            .expect(400)
            .expect((response) => {
              expect(response.body).toEqual({
                path: path,
                response: {
                  code: VALIDATION_ERROR,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  errors: expect.any(Object),
                },
                statusCode: 400,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              })

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              const errorMessages = Object.keys(response.body.response.errors).join(' ')

              expect(errorMessages).toContain('email')
              expect(errorMessages).toContain('sendNewToken')
              expect(errorMessages).toContain('page')
              expect(errorMessages).toContain('perPage')
            })
        }

        it('should throw 400 when body is not valid for signup', async () => {
          await testCase('/auth/verify-email/signup')
        })

        it('should throw 400 when body is not valid for reset', async () => {
          await testCase('/auth/verify-email/reset')
        })
      })

      describe('when token is already issued', () => {
        const testCase = async (path: string) => {
          return request(app.getHttpServer())
            .post(path)
            .send(body)
            .expect(409)
            .expect((response) => {
              expect(response.body).toEqual({
                path: path,
                response: {
                  code: AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
                  message: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued().message,
                },
                statusCode: 409,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              } as Record<string, unknown>)
            })
        }

        it('should throw ConflictException for signup', async () => {
          await verificationTokenDatabaseHelper.save(rawCurrentVerificationToken)

          await testCase('/auth/verify-email/signup')
        })

        it('should throw ConflictException for reset', async () => {
          await userDatabaseHelper.save(rawUser)
          await verificationTokenDatabaseHelper.save({
            ...rawCurrentVerificationToken,
            purpose: VerificationTokenPurpose.resetPassword().value,
          })

          await testCase('/auth/verify-email/reset')
        })
      })

      it('should throw ConflictException when email is already taken', async () => {
        await userDatabaseHelper.save(rawUser)

        return request(app.getHttpServer())
          .post('/auth/verify-email/signup')
          .send(body)
          .expect(409)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/verify-email/signup',
              response: {
                code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
                message: GenerateVerificationTokenApplicationError.emailAlreadyTaken().message,
              },
              statusCode: 409,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })
    })
  })

  describe('validate token', () => {
    const email = EmailAddressMother.random()
    const purpose = VerificationTokenPurpose.createAccount()
    const validTokenValue = VerificationTokenValueMother.random().value

    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
    let rawVerificationToken: VerificationTokenRawModel

    beforeEach(async () => {
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)

      const tokenHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER_SERVICE)
      const tokenHash = await tokenHasher.hash(validTokenValue)

      rawVerificationToken = makeRawVerificationToken({
        id: IdentifierMother.valid().value,
        email: email.value,
        purpose: purpose.value,
        token_hash: tokenHash,
        expires_at: futureDate,
        used_at: null,
        created_at: now,
      })
    })

    describe('happy path', () => {
      it('should return 204 when token is valid', async () => {
        await verificationTokenDatabaseHelper.save(rawVerificationToken)

        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({
            email: email.value,
            purpose: purpose.value,
            token: validTokenValue,
          })
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
          })
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error when body is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({ email: 'invalid-email' })
          .expect(400)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                path: '/auth/validate-token',
                response: {
                  code: VALIDATION_ERROR,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  errors: expect.any(Object),
                },
                statusCode: 400,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              }),
            )
          })
      })

      it('should throw UnprocessableEntityException when token purpose is not valid', async () => {
        const expectedDomainErrorMessage = VerificationTokenDomainException.invalidVerificationTokenPurpose().message

        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({
            email: email.value,
            purpose: 'INVALID_PURPOSE',
            token: validTokenValue,
          })
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/validate-token',
              response: {
                code: AUTH_VALIDATE_TOKEN_INVALID_PURPOSE,
                message: ValidateVerificationTokenError.invalidTokenPurpose(expectedDomainErrorMessage).message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw UnprocessableEntityException when token format is not valid', async () => {
        const expectedDomainErrorMessage = VerificationTokenDomainException.invalidVerificationTokenValue().message

        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({
            email: email.value,
            purpose: purpose.value,
            token: VerificationTokenValueMother.invalid(),
          })
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/validate-token',
              response: {
                code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN_FORMAT,
                message: ValidateVerificationTokenError.invalidTokenFormat(expectedDomainErrorMessage).message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw ConflictException when token is already used', async () => {
        await verificationTokenDatabaseHelper.save({ ...rawVerificationToken, used_at: now })

        const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyUsed().message

        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({
            email: email.value,
            purpose: purpose.value,
            token: validTokenValue,
          })
          .expect(409)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/validate-token',
              response: {
                code: AUTH_VALIDATE_TOKEN_ALREADY_USED,
                message: ValidateVerificationTokenError.alreadyUsed(expectedDomainErrorMessage).message,
              },
              statusCode: 409,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw GoneException when token is expired', async () => {
        await verificationTokenDatabaseHelper.save({ ...rawVerificationToken, expires_at: pastDate })

        const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyExpired().message

        return request(app.getHttpServer())
          .post('/auth/validate-token')
          .send({
            email: email.value,
            purpose: purpose.value,
            token: validTokenValue,
          })
          .expect(410)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/validate-token',
              response: {
                code: AUTH_VALIDATE_TOKEN_ALREADY_EXPIRED,
                message: ValidateVerificationTokenError.expired(expectedDomainErrorMessage).message,
              },
              statusCode: 410,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      describe('when endpoint throws NotFoundException', () => {
        const testCase = async (requestEmail: string, requestToken: string, requestPurpose: string) => {
          return request(app.getHttpServer())
            .post('/auth/validate-token')
            .send({
              email: requestEmail,
              purpose: requestPurpose,
              token: requestToken,
            })
            .expect(404)
            .expect((response) => {
              expect(response.body).toEqual({
                path: '/auth/validate-token',
                response: {
                  code: AUTH_VALIDATE_TOKEN_INVALID_TOKEN,
                  message: 'Invalid verification token',
                },
                statusCode: 404,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              } as Record<string, unknown>)
            })
        }

        it('should throw NotFoundException when token does not exist', async () => {
          await testCase(email.value, validTokenValue, purpose.value)
        })

        it('should throw NotFoundException when token exists but email does not match', async () => {
          await verificationTokenDatabaseHelper.save(rawVerificationToken)

          await testCase(EmailAddressMother.random().value, validTokenValue, purpose.value)
        })

        it('should throw NotFoundException when token exists but code is invalid', async () => {
          await verificationTokenDatabaseHelper.save(rawVerificationToken)

          await testCase(email.value, VerificationTokenValueMother.random().value, purpose.value)
        })

        it('should throw NotFoundException when token does not exist', async () => {
          await verificationTokenDatabaseHelper.save(rawVerificationToken)

          await testCase(email.value, validTokenValue, VerificationTokenPurpose.resetPassword().value)
        })
      })
    })
  })

  describe('signup', () => {
    const userEmail = EmailAddressMother.random()
    const username = UserUsernameMother.random()
    const userName = UserNameMother.random()
    const userPassword = UserPasswordMother.valid()
    const tokenValue = VerificationTokenValueMother.valid()
    const sportsmanRole = UserRoleMother.sportsman()

    let userDatabaseHelper: UserDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)
    })

    const getValidPayload = () => ({
      email: userEmail.value,
      username: username.value,
      name: userName.value,
      password: userPassword.value,
      token: tokenValue.value,
      requestedRole: sportsmanRole.value,
    })

    const saveTokenInDatabase = async (overrides: Partial<VerificationTokenRawModel> = {}) => {
      const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER_SERVICE)
      const tokenHash = await passwordHasher.hash(tokenValue.value)
      const rawToken = makeRawVerificationToken({
        id: IdentifierMother.valid().value,
        email: userEmail.value,
        purpose: VerificationTokenPurpose.createAccount().value,
        expires_at: futureDate,
        used_at: null,
        token_hash: tokenHash,
        ...overrides,
      })

      await verificationTokenDatabaseHelper.save(rawToken)
      return rawToken
    }

    describe('happy path', () => {
      it('should return 204 No Content when user is registered correctly', async () => {
        await saveTokenInDatabase()

        const result = await request(app.getHttpServer()).post('/auth/signup').send(getValidPayload())

        expect(result.status).toBe(204)
        expect(result.body).toEqual({})

        const savedUser = await userDatabaseHelper.findByEmail(userEmail.value)
        expect(savedUser).not.toBeNull()
        expect(savedUser!.username).toBe(username.value)
        expect(savedUser!.name).toBe(userName.value)
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error when body is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ page: 5, perPage: 12 })
          .expect(400)
          .expect((response) => {
            expect(response.body.response.code).toEqual(VALIDATION_ERROR)
            expect(response.body.response.errors).toBeDefined()

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const errorMessages = Object.keys(response.body.response.errors).join(' ')
            expect(errorMessages).toContain('email')
            expect(errorMessages).toContain('password')
            expect(errorMessages).toContain('username')
            expect(errorMessages).toContain('token')
            expect(errorMessages).toContain('requestedRole')
            expect(errorMessages).toContain('page')
            expect(errorMessages).toContain('perPage')
          })
      })

      it('should throw UnprocessableEntityException when password format is not valid', async () => {
        await saveTokenInDatabase()

        const invalidPassword = UserPasswordMother.invalid()
        const expectedDomainErrorMessage = UserCredentialDomainException.invalidPasswordFormat().message

        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ ...getValidPayload(), password: invalidPassword })
          .expect(422)
          .expect((response) => {
            expect(response.body.response.code).toEqual(AUTH_CREATE_USER_INVALID_INPUT)
            expect(response.body.response.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  field: 'password',
                  error: expectedDomainErrorMessage,
                  type: 'validation',
                }),
              ]),
            )
          })
      })

      describe('when data is duplicated', () => {
        it('should throw ConflictException when email is already registered', async () => {
          await saveTokenInDatabase()

          await userDatabaseHelper.save(
            makeRawUser({
              id: IdentifierMother.valid().value,
              email: userEmail.value,
              status: UserStatus.active().value,
            }),
          )

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_DUPLICATED_DATA)
              expect(response.body.response.errors).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    field: 'email',
                    type: 'conflict',
                  }),
                ]),
              )
            })
        })

        it('should throw ConflictException when username is already taken', async () => {
          await saveTokenInDatabase()

          await userDatabaseHelper.save(
            makeRawUser({
              id: IdentifierMother.valid().value,
              email: EmailAddressMother.random().value,
              username: username.value,
              status: UserStatus.active().value,
            }),
          )

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_DUPLICATED_DATA)
              expect(response.body.response.errors).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    field: 'username',
                    type: 'conflict',
                  }),
                ]),
              )
            })
        })
      })

      describe('when token is not valid', () => {
        it('should throw NotFoundException when token does not exist', async () => {
          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(404)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_INVALID_TOKEN)
              expect(response.body.response.message).toEqual('Invalid verification token')
            })
        })

        it('should throw GoneException when token is already expired', async () => {
          await saveTokenInDatabase({ expires_at: pastDate })

          const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyExpired().message
          const expectedApplicationError = CreateUserApplicationError.tokenExpired(expectedDomainErrorMessage)

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(410)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED)
              expect(response.body.response.message).toEqual(expectedApplicationError.message)
            })
        })

        it('should throw ConflictException when token is already used', async () => {
          await saveTokenInDatabase({ used_at: pastDate })

          const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyUsed().message
          const expectedApplicationError = CreateUserApplicationError.tokenAlreadyUsed(expectedDomainErrorMessage)

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_TOKEN_ALREADY_USED)
              expect(response.body.response.message).toEqual(expectedApplicationError.message)
            })
        })

        it('should throw NotFoundException when token exists but code is invalid', async () => {
          await saveTokenInDatabase()

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send({ ...getValidPayload(), token: VerificationTokenValueMother.random().value })
            .expect(404)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_INVALID_TOKEN)
              expect(response.body.response.message).toEqual('Invalid verification token')
            })
        })
      })
    })
  })

  describe('reset-password', () => {
    const validEmail = EmailAddressMother.random()
    const validTokenValue = VerificationTokenValueMother.valid()
    const validNewPassword = UserPasswordMother.valid()
    const validOldPassword = UserPasswordMother.random()

    let userDatabaseHelper: UserDatabaseHelper
    let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)
    })

    const getValidPayload = () => ({
      email: validEmail.value,
      token: validTokenValue.value,
      password: validNewPassword.value,
    })

    const saveSetupInDatabase = async (overrides: Partial<VerificationTokenRawModel> = {}) => {
      const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER_SERVICE)
      const tokenHash = await passwordHasher.hash(validTokenValue.value)
      const oldPasswordHash = await passwordHasher.hash(validOldPassword.value)

      const userId = IdentifierMother.valid().value

      const rawUser = makeRawUser({
        id: userId,
        email: validEmail.value,
        status: UserStatus.active().value,
      })

      const rawCredential = makeRawUserCredential({
        user_id: userId,
        password_hash: oldPasswordHash,
      })

      const rawToken = makeRawVerificationToken({
        id: IdentifierMother.valid().value,
        email: validEmail.value,
        purpose: VerificationTokenPurpose.resetPassword().value,
        expires_at: futureDate,
        used_at: null,
        token_hash: tokenHash,
        ...overrides,
      })

      await userDatabaseHelper.save(rawUser)
      await userCredentialDatabaseHelper.save(rawCredential)
      await verificationTokenDatabaseHelper.save(rawToken)

      return { rawUser, rawCredential, rawToken }
    }

    describe('happy path', () => {
      it('should return 204 No Content when password is reset correctly', async () => {
        await saveSetupInDatabase()

        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send(getValidPayload())
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
          })
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error when body is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({ email: 'not-an-email' })
          .expect(400)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                path: '/auth/reset-password',
                response: expect.objectContaining({
                  code: VALIDATION_ERROR,
                }),
                statusCode: 400,
              }),
            )

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const errorMessages = Object.keys(response.body.response.errors).join(' ')
            expect(errorMessages).toContain('email')
            expect(errorMessages).toContain('password')
            expect(errorMessages).toContain('token')
          })
      })

      it('should throw UnprocessableEntityException when password format is not valid', async () => {
        await saveSetupInDatabase()

        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({ ...getValidPayload(), password: UserPasswordMother.invalid() })
          .expect(422)
          .expect((response) => {
            expect(response.body.response.errors[0].code).toEqual(AUTH_RESET_PASSWORD_INVALID_PASSWORD_FORMAT)
          })
      })

      it('should throw ConflictException when trying to use the same password', async () => {
        await saveSetupInDatabase()

        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({ ...getValidPayload(), password: validOldPassword.value })
          .expect(409)
          .expect((response) => {
            expect(response.body.response.code).toEqual(AUTH_RESET_PASSWORD_SAME_PASSWORD)
            expect(response.body.response.message).toEqual('New password cannot be the same as the current password')
          })
      })

      describe('when token or user is not found', () => {
        it('should throw NotFoundException when token does not exist', async () => {
          await userDatabaseHelper.save(makeRawUser({ email: validEmail.value }))

          return request(app.getHttpServer())
            .post('/auth/reset-password')
            .send(getValidPayload())
            .expect(404)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_RESET_PASSWORD_INVALID_TOKEN)
              expect(response.body.response.message).toEqual('Invalid verification token')
            })
        })

        it('should throw NotFoundException when user does not exist', async () => {
          const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER_SERVICE)
          const tokenHash = await passwordHasher.hash(validTokenValue.value)

          await verificationTokenDatabaseHelper.save(
            makeRawVerificationToken({
              email: validEmail.value,
              purpose: VerificationTokenPurpose.resetPassword().value,
              token_hash: tokenHash,
            }),
          )

          return request(app.getHttpServer())
            .post('/auth/reset-password')
            .send(getValidPayload())
            .expect(404)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_RESET_PASSWORD_INVALID_TOKEN)
              expect(response.body.response.message).toEqual('Invalid verification token')
            })
        })
      })
    })
  })

  describe('logout', () => {
    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper
    let tokenService: TokenGeneratorApplicationServiceInterface

    const userId = IdentifierMother.valid()
    const sessionId = IdentifierMother.valid()

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)
      tokenService = app.get<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)
    })

    const saveSetupInDatabase = async () => {
      const rawUser = makeRawUser({ id: userId.value })
      const rawSession = makeRawSession({
        id: sessionId.value,
        user_id: userId.value,
        revoked_at: null,
        expires_at: futureDate,
      })

      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save(rawSession)

      const accessToken = await tokenService.generateAccessToken(rawSession.user_id, rawSession.id, rawSession.expires_at, now)

      return { accessToken }
    }

    describe('happy path', () => {
      it('should return 204 No Content and clear cookies when logging out', async () => {
        const { accessToken } = await saveSetupInDatabase()

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereCleared(cookies)
          })

        const revokedSession = await userSessionDatabaseHelper.findById(sessionId.value)
        expect(revokedSession).not.toBeNull()
        expect(revokedSession!.revoked_at).not.toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should return 204 and clear cookies when access token is not present', async () => {
        return request(app.getHttpServer())
          .post('/auth/logout')
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereCleared(cookies)
          })
      })

      it('should return 204 and clear cookies when session does not exist', async () => {
        const accessToken = await tokenService.generateAccessToken(userId.value, sessionId.value, futureDate, now)

        await userDatabaseHelper.save(makeRawUser({ id: userId.value }))

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereCleared(cookies)
          })
      })
    })
  })

  describe('closeSession', () => {
    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper
    let tokenService: TokenGeneratorApplicationServiceInterface

    const userId = IdentifierMother.valid()
    const sessionId = IdentifierMother.valid()

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)
      tokenService = app.get<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)
    })

    const saveSetupInDatabase = async () => {
      const rawUser = makeRawUser({ id: userId.value })
      const rawSession = makeRawSession({
        id: sessionId.value,
        user_id: userId.value,
        revoked_at: null,
        expires_at: futureDate,
      })

      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save(rawSession)

      const accessToken = await tokenService.generateAccessToken(rawSession.user_id, rawSession.id, rawSession.expires_at, now)

      return { accessToken }
    }

    describe('happy path', () => {
      it('should return 204 No Content and clear cookies when closing current session', async () => {
        const { accessToken } = await saveSetupInDatabase()
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        await request(app.getHttpServer())
          .delete(`/auth/sessions/${sessionId.value}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereCleared(cookies)
          })

        const revokedCurrentSession = await userSessionDatabaseHelper.findById(sessionId.value)
        expect(revokedCurrentSession).not.toBeNull()
        expect(revokedCurrentSession!.revoked_at).not.toBeNull()
      })

      it('should return 204 No Content and not clear cookies when closing a different valid session', async () => {
        const { accessToken } = await saveSetupInDatabase()

        const otherSessionId = IdentifierMother.valid()
        await userSessionDatabaseHelper.save(
          makeRawSession({
            id: otherSessionId.value,
            user_id: userId.value,
            revoked_at: null,
          }),
        )

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        await request(app.getHttpServer())
          .delete(`/auth/sessions/${otherSessionId.value}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereNotCleared(cookies)
          })

        const revokedOtherSession = await userSessionDatabaseHelper.findById(otherSessionId.value)
        expect(revokedOtherSession).not.toBeNull()
        expect(revokedOtherSession!.revoked_at).not.toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 when session id in URL is not a valid UUID', async () => {
        const invalidSessionId = IdentifierMother.invalid()

        const { accessToken } = await saveSetupInDatabase()
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .delete(`/auth/sessions/${invalidSessionId}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(400)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereNotCleared(cookies)
          })
      })

      it('should throw 401 UnauthorizedException when access token is not present', async () => {
        return request(app.getHttpServer())
          .delete(`/auth/sessions/${sessionId.value}`)
          .expect(401)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereNotCleared(cookies)
          })
      })

      it('should return 204 No Content and clear cookies when closing current session but it does not exist', async () => {
        const accessToken = await tokenService.generateAccessToken(userId.value, sessionId.value, futureDate, now)

        await userDatabaseHelper.save(makeRawUser({ id: userId.value }))

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .delete(`/auth/sessions/${sessionId.value}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereCleared(cookies)
          })
      })

      it('should return 204 No Content and not clear cookies when closing a different session and it does not exist', async () => {
        const { accessToken } = await saveSetupInDatabase()
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        const nonExistentSessionId = IdentifierMother.valid()

        return request(app.getHttpServer())
          .delete(`/auth/sessions/${nonExistentSessionId.value}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereNotCleared(cookies)
          })
      })

      it('should return 204 No Content and not clear cookies when trying to close another user session', async () => {
        const { accessToken } = await saveSetupInDatabase()

        const anotherUserId = IdentifierMother.valid()
        const anotherSessionId = IdentifierMother.valid()
        await userDatabaseHelper.save(makeRawUser({ id: anotherUserId.value }))

        await userSessionDatabaseHelper.save(
          makeRawSession({
            id: anotherSessionId.value,
            user_id: anotherUserId.value,
            revoked_at: null,
          }),
        )

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .delete(`/auth/sessions/${anotherSessionId.value}`)
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(204)
          .expect((response) => {
            const cookies = response.headers['set-cookie'] as unknown as Array<string>

            checkAuthCookiesWereNotCleared(cookies)
          })
      })
    })
  })

  describe('security details', () => {
    const olderDate = new Date(now.getTime() - 5000)
    const newerDate = now

    const userId = IdentifierMother.valid()
    const currentSessionId = IdentifierMother.valid()
    const otherSessionId = IdentifierMother.valid()

    let userDatabaseHelper: UserDatabaseHelper
    let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper
    let tokenService: TokenGeneratorApplicationServiceInterface

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)
      tokenService = app.get<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)
    })

    describe('happy path', () => {
      it('should return 200 OK and the list of active sessions', async () => {
        const rawUser = makeRawUser({ id: userId.value })
        const rawCredential = makeRawUserCredential({ user_id: userId.value })

        const rawCurrentSession = makeRawSession({
          id: currentSessionId.value,
          user_id: userId.value,
          revoked_at: null,
          expires_at: futureDate,
          created_at: olderDate,
        })

        const rawOtherSession = makeRawSession({
          id: otherSessionId.value,
          user_id: userId.value,
          revoked_at: null,
          expires_at: futureDate,
          created_at: newerDate,
        })

        await userDatabaseHelper.save(rawUser)
        await userCredentialDatabaseHelper.save(rawCredential)
        await userSessionDatabaseHelper.save([rawCurrentSession, rawOtherSession])

        const accessToken = await tokenService.generateAccessToken(userId.value, currentSessionId.value, futureDate, now)

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .get('/auth/security-details')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(200)
          .expect((response) => {
            const body = response.body as GetUserSecurityDetailsQueryResponseDto

            expect(body.sessions).toBeDefined()
            expect(body.credential).toBeDefined()
            expect(body.sessions).toHaveLength(2)

            expect(body.sessions[0]).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                id: expect.any(String),
                deviceInfo: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  raw: expect.any(String),
                  browser: {
                    name: expectStringOrNull,
                    version: expectStringOrNull,
                  },
                  os: {
                    name: expectStringOrNull,
                    version: expectStringOrNull,
                  },
                  hardware: {
                    type: expectStringOrNull,
                    vendor: expectStringOrNull,
                    model: expectStringOrNull,
                  },
                },
                deviceLocation: {
                  countryCode: expectStringOrNull,
                  city: expectStringOrNull,
                },
                activeSince: <Record<string, unknown>>{
                  quantity: expect.any(Number),
                  unit: expect.any(String),
                },
                expiresAt: <Record<string, unknown>>{
                  quantity: expect.any(Number),
                  unit: expect.any(String),
                },
                isCurrent: expect.any(Boolean),
              }),
            )

            expect(body.credential).toEqual(
              expect.objectContaining({
                lastModifiedAt: <Record<string, unknown>>{
                  quantity: expect.any(Number),
                  unit: expect.any(String),
                },
              }),
            )
          })
      })

      it('should return 200 OK and only the current session when user has no other active sessions', async () => {
        await userDatabaseHelper.save(makeRawUser({ id: userId.value }))
        await userCredentialDatabaseHelper.save(makeRawUserCredential({ user_id: userId.value }))

        const rawCurrentSession = makeRawSession({
          id: currentSessionId.value,
          user_id: userId.value,
          revoked_at: null,
          expires_at: futureDate,
          created_at: now,
        })
        await userSessionDatabaseHelper.save([rawCurrentSession])

        const accessToken = await tokenService.generateAccessToken(userId.value, currentSessionId.value, futureDate, now)
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .get('/auth/security-details')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(200)
          .expect((response) => {
            const body = response.body as GetUserSecurityDetailsQueryResponseDto

            expect(body.sessions).toBeDefined()
            expect(body.sessions).toHaveLength(1)
            expect(body.sessions[0].isCurrent).toBe(true)
          })
      })
    })

    describe('when there are errors', () => {
      it('should return 401 Unauthorized when access token cookie is missing', async () => {
        return request(app.getHttpServer()).get('/auth/security-details').expect(401)
      })

      it('should return 401 Unauthorized when access token is invalid', async () => {
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .get('/auth/security-details')
          .set('Cookie', [`${accessCookieName}=invalid.jwt.token`])
          .expect(401)
      })

      it('should return 401 Unauthorized when the session associated with the token does not exist in the database', async () => {
        await userDatabaseHelper.save(makeRawUser({ id: userId.value }))
        await userCredentialDatabaseHelper.save(makeRawUserCredential({ user_id: userId.value }))

        const accessToken = await tokenService.generateAccessToken(userId.value, currentSessionId.value, futureDate, now)
        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .get('/auth/security-details')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .expect(401)
      })
    })
  })
})
