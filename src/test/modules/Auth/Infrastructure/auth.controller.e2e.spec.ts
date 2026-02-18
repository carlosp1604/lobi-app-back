import { DataSource } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
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
import { UNAUTHORIZED_ACCESS, VALIDATION_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import {
  EMAIL_SENDER_SERVICE,
  HASHER_SERVICE,
  PASSWORD_HASHER,
  REQUEST_ORIGIN_SERVICE,
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
  AUTH_CREATE_USER_DUPLICATED_EMAIL,
  AUTH_CREATE_USER_DUPLICATED_USERNAME,
  AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
  AUTH_CREATE_USER_INVALID_TOKEN,
  AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED,
  AUTH_CREATE_USER_TOKEN_ALREADY_USED,
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
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
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { expectIsoDate } from '~/src/test/utils/matchers'
import { HashMother } from '~/src/test/mothers/HashMother'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'
import { CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { ContextModule } from '~/src/modules/Shared/Infrastructure/context.module'

describe('AuthController', () => {
  const now = new Date()

  let app: NestFastifyApplication
  let dataSource: DataSource
  let configService: ConfigService<Env, true>

  /* Third-party dependant service */
  const mockedEmailSenderService = {
    sendWithTemplate: jest.fn().mockResolvedValue(undefined),
  }

  /* Third-party dependant service */
  const mockedRequestOriginService = {
    process: jest.fn().mockResolvedValue({
      ipHash: HashMother.valid(),
      normalizedIp: '127.0.0.1',
      deviceLocation: DeviceLocationMother.valid(),
      userAgent: UserAgentMother.valid(),
    }),
  }

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
      .overrideProvider(REQUEST_ORIGIN_SERVICE)
      .useValue(mockedRequestOriginService)
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

  const checkAuthCookies = (cookies: string) => {
    const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })
    const refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

    expect(cookies).toBeDefined()
    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining(`${accessCookieName}=`), expect.stringContaining(`${refreshCookieName}=`)]),
    )
  }

  describe('login', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.random()

    let userDatabaseHelper: UserDatabaseHelper
    let userCredentialDatabaseHelper: UserCredentialDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCredential: UserCredentialRawWitRelationships
    const validPassword = UserPasswordMother.valid().value

    beforeEach(async () => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)

      const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER)
      const userPassword = await passwordHasher.hash(validPassword)

      rawCredential = makeRawUserCredential({
        user_id: userId.value,
        locked_until: null,
        last_login_at: null,
        failed_attempts: 0,
        password_hash: userPassword,
      })

      rawUser = makeRawUser({
        id: userId.value,
        email: userEmail.value,
        status: UserStatus.active().value,
      })
    })

    describe('happy path', () => {
      it('should return 200 when user is authenticated correctly', async () => {
        await userDatabaseHelper.save(rawUser)
        await userCredentialDatabaseHelper.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.value, password: validPassword })
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
              sessionId: expect.any(String),
              accessTokenExpiresAt: expectIsoDate,
              refreshTokenExpiresAt: expectIsoDate,
              isNewDevice: expect.any(Boolean),
            } as Record<string, unknown>)

            const cookies = response.headers['set-cookie']
            checkAuthCookies(cookies)
          })
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error if body is not valid', async () => {
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
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.value, password: 'invalid-password' })
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/login',
              response: {
                code: AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
                message: LoginUserApplicationError.invalidPasswordFormat().message,
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
            .send({ email: userEmail.value, password })
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
          await testCase(validPassword)
        })

        it('should throw UnauthorizedException when user is deleted', async () => {
          await userDatabaseHelper.save({ ...rawUser, deleted_at: now })

          await testCase(validPassword)
        })

        it('should throw UnauthorizedException when user is not active', async () => {
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase(validPassword)
        })

        it('should throw UnauthorizedException when user does not have credentials', async () => {
          await userDatabaseHelper.save(rawUser)

          await testCase(validPassword)
        })

        it('should throw UnauthorizedException when user password does not match', async () => {
          await userDatabaseHelper.save(rawUser)
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase(UserPasswordMother.random().value)
        })
      })
    })
  })

  describe('refresh', () => {
    const futureExpiresAt = new Date(now.getTime() + 3600 * 1000)
    const pastExpiresAt = new Date(now.getTime() - 3600 * 1000)
    let refreshCookieName: string

    const userId = UserIdMother.valid()
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
        expires_at: futureExpiresAt,
        token_hash: hashedToken,
      })
    })

    describe('happy path', () => {
      it('should return 200 when session is successfully refreshed', async () => {
        await userDatabaseHelper.save(rawUser)
        await userSessionDatabaseHelper.save(rawCurrentSession)

        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `${refreshCookieName}=${inputToken}`)
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
              sessionId: expect.any(String),
              accessTokenExpiresAt: expectIsoDate,
              refreshTokenExpiresAt: expectIsoDate,
            } as Record<string, unknown>)

            const cookies = response.headers['set-cookie']
            checkAuthCookies(cookies)
          })
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
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: pastExpiresAt, revoked_at: null })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should throw UnauthorizedException when session is already revoked', async () => {
          await userDatabaseHelper.save(rawUser)
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: futureExpiresAt, revoked_at: now })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })
      })

      it('should throw UnprocessableEntityException when token format is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `${refreshCookieName}=invalid-token-format`)
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
    const futureExpiresAt = new Date(now.getTime() + 3600 * 1000)

    const userEmail = VerificationTokenEmailMother.random()
    let userDatabaseHelper: UserDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCurrentVerificationToken: VerificationTokenRawModel

    const validBody = { email: userEmail.value, sendNewToken: false, language: 'es' }

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
        expires_at: futureExpiresAt,
        used_at: null,
        token_hash: VerificationTokenTokenHashMother.random().value,
      })
    })

    describe('happy path', () => {
      it('should return 204 for signup when user does not exist', async () => {
        return request(app.getHttpServer()).post('/auth/verify-email/signup').send(validBody).expect(204)
      })

      it('should return 204 for reset password when user exists', async () => {
        await userDatabaseHelper.save(rawUser)
        return request(app.getHttpServer()).post('/auth/verify-email/reset').send(validBody).expect(204)
      })

      it('should return 204 if user does not exist for reset password', async () => {
        return request(app.getHttpServer()).post('/auth/verify-email/reset').send(validBody).expect(204)
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
              expect(errorMessages).toContain('language')
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
        const testCase = async (path: string, purpose: string) => {
          return request(app.getHttpServer())
            .post(path)
            .send(validBody)
            .expect(409)
            .expect((response) => {
              expect(response.body).toEqual({
                path: path,
                response: {
                  code: AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
                  message: `An active VerificationToken for ${purpose} was already issued for email ${userEmail.value}`,
                },
                statusCode: 409,
                requestId: expect.any(String),
                timestamp: expectIsoDate,
              } as Record<string, unknown>)
            })
        }

        it('should throw ConflictException for signup', async () => {
          await verificationTokenDatabaseHelper.save(rawCurrentVerificationToken)

          await testCase('/auth/verify-email/signup', VerificationTokenPurpose.createAccount().value)
        })

        it('should throw ConflictException for reset', async () => {
          await userDatabaseHelper.save(rawUser)
          await verificationTokenDatabaseHelper.save({
            ...rawCurrentVerificationToken,
            purpose: VerificationTokenPurpose.resetPassword().value,
          })

          await testCase('/auth/verify-email/reset', VerificationTokenPurpose.resetPassword().value)
        })
      })

      it('should throw ConflictException when email is already taken', async () => {
        await userDatabaseHelper.save(rawUser)

        return request(app.getHttpServer())
          .post('/auth/verify-email/signup')
          .send(validBody)
          .expect(409)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/verify-email/signup',
              response: {
                code: AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
                message: `Email ${userEmail.value} is already taken`,
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
    const email = VerificationTokenEmailMother.random()
    const purpose = VerificationTokenPurpose.createAccount()
    const validTokenValue = VerificationTokenValueMother.random().value

    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
    let rawVerificationToken: VerificationTokenRawModel

    const now = new Date()
    const futureDate = new Date(now.getTime() + 10000)
    const pastDate = new Date(now.getTime() - 10000)

    beforeEach(async () => {
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)

      const tokenHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER)
      const tokenHash = await tokenHasher.hash(validTokenValue)

      rawVerificationToken = makeRawVerificationToken({
        id: VerificationTokenIdMother.valid().value,
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
      it('should throw 400 error if body is not valid', async () => {
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
                message: ValidateVerificationTokenError.invalidTokenPurpose('INVALID_PURPOSE').message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw UnprocessableEntityException when token format is not valid', async () => {
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
                message: ValidateVerificationTokenError.invalidTokenFormat().message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw ConflictException when token is already used', async () => {
        await verificationTokenDatabaseHelper.save({ ...rawVerificationToken, used_at: now })

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
                message: ValidateVerificationTokenError.alreadyUsed().message,
              },
              statusCode: 409,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw GoneException when token is expired', async () => {
        await verificationTokenDatabaseHelper.save({ ...rawVerificationToken, expires_at: pastDate })

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
                message: ValidateVerificationTokenError.expired().message,
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

          await testCase(VerificationTokenEmailMother.random().value, validTokenValue, purpose.value)
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
    const validEmail = UserEmailMother.random()
    const validUsername = UserUsernameMother.random()
    const validName = UserNameMother.random()
    const validPassword = UserPasswordMother.valid()
    const validTokenValue = VerificationTokenValueMother.valid()
    const validRole = UserRoleMother.sportsman()

    let userDatabaseHelper: UserDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)
    })

    const getValidPayload = () => ({
      email: validEmail.value,
      username: validUsername.value,
      name: validName.value,
      password: validPassword.value,
      token: validTokenValue.value,
      requestedRole: validRole.value,
    })

    const saveTokenInDatabase = async (overrides: Partial<VerificationTokenRawModel> = {}) => {
      const passwordHasher = await app.resolve<HasherServiceInterface>(PASSWORD_HASHER)
      const tokenHash = await passwordHasher.hash(validTokenValue.value)
      const rawToken = makeRawVerificationToken({
        id: VerificationTokenIdMother.valid().value,
        email: validEmail.value,
        purpose: VerificationTokenPurpose.createAccount().value,
        expires_at: new Date(now.getTime() + 3600 * 1000),
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

        await request(app.getHttpServer())
          .post('/auth/signup')
          .send(getValidPayload())
          .expect(204)
          .expect((response) => {
            expect(response.body).toEqual({})
          })
      })
    })

    describe('when there are errors', () => {
      it('should throw 400 error if body is not valid', async () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ page: 5, perPage: 12 })
          .expect(400)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                path: '/auth/signup',
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
            expect(errorMessages).toContain('username')
            expect(errorMessages).toContain('page')
            expect(errorMessages).toContain('perPage')
          })
      })

      it('should throw UnprocessableEntityException when password format is not valid', async () => {
        await saveTokenInDatabase()

        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({ ...getValidPayload(), password: 'invalid-password' })
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/auth/signup',
              response: {
                message: 'One or more fields have invalid formats',
                errors: [
                  {
                    code: AUTH_CREATE_USER_INVALID_PASSWORD_FORMAT,
                    message: CreateUserError.invalidPassword().message,
                  },
                ],
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      describe('when data is duplicated', () => {
        it('should throw ConflictException when email is already registered', async () => {
          await saveTokenInDatabase()

          await userDatabaseHelper.save(
            makeRawUser({
              id: UserIdMother.valid().value,
              email: validEmail.value,
              status: UserStatus.active().value,
            }),
          )

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.errors[0].code).toEqual(AUTH_CREATE_USER_DUPLICATED_EMAIL)
              expect(response.body.response.errors[0].message).toEqual(CreateUserError.duplicatedEmail(validEmail.value).message)
            })
        })

        it('should throw ConflictException when username is already taken', async () => {
          await saveTokenInDatabase()

          await userDatabaseHelper.save(
            makeRawUser({
              id: UserIdMother.valid().value,
              email: UserEmailMother.random().value,
              username: validUsername.value,
              status: UserStatus.active().value,
            }),
          )

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.errors[0].code).toEqual(AUTH_CREATE_USER_DUPLICATED_USERNAME)
              expect(response.body.response.errors[0].message).toEqual(CreateUserError.duplicatedUsername(validUsername.value).message)
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
          await saveTokenInDatabase({
            expires_at: new Date(now.getTime() - 1000),
          })

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(410)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_TOKEN_ALREADY_EXPIRED)
              expect(response.body.response.message).toEqual(CreateUserError.tokenExpired().message)
            })
        })

        it('should throw ConflictException when token is already used', async () => {
          await saveTokenInDatabase({
            used_at: new Date(now.getTime() - 5000),
          })

          return request(app.getHttpServer())
            .post('/auth/signup')
            .send(getValidPayload())
            .expect(409)
            .expect((response) => {
              expect(response.body.response.code).toEqual(AUTH_CREATE_USER_TOKEN_ALREADY_USED)
              expect(response.body.response.message).toEqual(CreateUserError.tokenAlreadyUsed().message)
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
})
