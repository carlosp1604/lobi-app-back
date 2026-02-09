import { DataSource } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { BCryptPasswordHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptPasswordHasherService'
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
  AUTH_LOGIN_INVALID_PASSWORD_FORMAT,
  AUTH_REFRESH_INVALID_TOKEN_FORMAT,
  AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
  AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
} from '~/src/modules/Auth/Infrastructure/ApiCodes'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { expectIsoDate } from '~/src/test/utils/matchers'

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
      ipHash: UserSessionIpHashMother.random().toString(),
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
    const passwordHasher = new BCryptPasswordHasherService(1)

    let userDatabaseHelper: UserDatabaseHelper
    let userCredentialDatabaseHelper: UserCredentialDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCredential: UserCredentialRawWitRelationships
    const validPassword = UserPasswordMother.valid()

    beforeEach(async () => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)

      const userPassword = await passwordHasher.hash(validPassword)

      rawCredential = makeRawUserCredential({
        user_id: userId.toString(),
        locked_until: null,
        last_login_at: null,
        failed_attempts: 0,
        password_hash: userPassword,
      })

      rawUser = makeRawUser({
        id: userId.toString(),
        email: userEmail.toString(),
        status: UserStatus.active().toString(),
      })
    })

    describe('happy path', () => {
      it('should return 200 when user is authenticated correctly', async () => {
        await userDatabaseHelper.save(rawUser)
        await userCredentialDatabaseHelper.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: validPassword })
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
                timestamp: expect.any(String),
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
          .send({ email: userEmail.toString(), password: 'invalid-password' })
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
              timestamp: expect.any(String),
            } as Record<string, unknown>)
          })
      })

      describe('when endpoint throws UnauthorizedException', () => {
        const testCase = async (password: string) => {
          return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userEmail.toString(), password })
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
                timestamp: expect.any(String),
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
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().toString() })
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

          await testCase(UserPasswordMother.random())
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
        id: userId.toString(),
        status: UserStatus.active().toString(),
      })

      rawCurrentSession = makeRawSession({
        user_id: userId.toString(),
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
                timestamp: expect.any(String),
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
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().toString() })
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
              timestamp: expect.any(String),
            } as Record<string, unknown>)
          })
      })
    })
  })

  describe('verify email', () => {
    const futureExpiresAt = new Date(now.getTime() + 3600 * 1000)

    const userEmail = 'test@email.com'
    let userDatabaseHelper: UserDatabaseHelper
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    let rawUser: UserRawModelWithRelations
    let rawCurrentVerificationToken: VerificationTokenRawModel

    const validBody = { email: userEmail.toString(), sendNewToken: false, language: 'es' }

    beforeEach(() => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(dataSource.manager)

      rawUser = makeRawUser({
        email: userEmail.toString(),
        status: UserStatus.active().toString(),
        deleted_at: null,
      })

      rawCurrentVerificationToken = makeRawVerificationToken({
        email: userEmail.toString(),
        purpose: VerificationTokenPurpose.createAccount().toString(),
        expires_at: futureExpiresAt,
        used_at: null,
        token_hash: VerificationTokenTokenHashMother.random().toString(),
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                timestamp: expect.any(String),
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
                  message: `An active VerificationToken for ${purpose} was already issued for email ${userEmail.toString()}`,
                },
                statusCode: 409,
                requestId: expect.any(String),
                timestamp: expect.any(String),
              } as Record<string, unknown>)
            })
        }

        it('should throw ConflictException for signup', async () => {
          await verificationTokenDatabaseHelper.save(rawCurrentVerificationToken)

          await testCase('/auth/verify-email/signup', VerificationTokenPurpose.createAccount().toString())
        })

        it('should throw ConflictException for reset', async () => {
          await userDatabaseHelper.save(rawUser)
          await verificationTokenDatabaseHelper.save({
            ...rawCurrentVerificationToken,
            purpose: VerificationTokenPurpose.resetPassword().toString(),
          })

          await testCase('/auth/verify-email/reset', VerificationTokenPurpose.resetPassword().toString())
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
                message: `Email ${userEmail.toString()} is already taken`,
              },
              statusCode: 409,
              requestId: expect.any(String),
              timestamp: expect.any(String),
            } as Record<string, unknown>)
          })
      })
    })
  })
})
