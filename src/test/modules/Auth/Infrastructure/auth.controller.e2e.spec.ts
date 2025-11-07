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
import { HASHER_SERVICE, TOKEN_GENERATOR } from '~/src/modules/Auth/Infrastructure/auth.tokens'
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
  AUTH_VERIFY_EMAIL_EMAIL_ALREADY_TAKEN,
  AUTH_VERIFY_EMAIL_TOKEN_ALREADY_ISSUED,
} from '~/src/modules/Auth/Infrastructure/ApiCodes'

describe('AuthController', () => {
  const now = new Date()

  let app: NestFastifyApplication
  let dataSource: DataSource
  let configService: ConfigService<Env, true>

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

    beforeEach(async () => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(dataSource.manager)

      const userPassword = await passwordHasher.hash('expected-password')

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
      it('should authenticate user correctly', async () => {
        await userDatabaseHelper.save(rawUser)
        await userCredentialDatabaseHelper.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'expected-password' })
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
              sessionId: expect.any(String),
              accessTokenExpiresAt: expect.any(String),
              refreshTokenExpiresAt: expect.any(String),
              isNewDevice: expect.any(Boolean),
            } as Record<string, unknown>)

            const cookies = response.headers['set-cookie']
            checkAuthCookies(cookies)
          })
      })
    })

    describe('when there are errors', () => {
      it('should return 400 error if body is not valid', async () => {
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

        it('should return 401 if user is not found', async () => {
          await testCase('expected-password')
        })

        it('should return 401 if user is deleted', async () => {
          await userDatabaseHelper.save({ ...rawUser, deleted_at: now })

          await testCase('expected-password')
        })

        it('should return 401 if user is not active', async () => {
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().toString() })
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase('expected-password')
        })

        it('should return 401 if user does not have credentials', async () => {
          await userDatabaseHelper.save(rawUser)

          await testCase('expected-password')
        })

        it('should return 401 if user password does not match', async () => {
          await userDatabaseHelper.save(rawUser)
          await userCredentialDatabaseHelper.save(rawCredential)

          await testCase('another-password')
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

    beforeEach(async () => {
      refreshCookieName = configService.get<string>('REFRESH_COOKIE_NAME', { infer: true })

      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)

      const tokenGeneratorService = await app.resolve<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)
      const hasherService = await app.resolve<HasherServiceInterface>(HASHER_SERVICE)
      inputToken = await tokenGeneratorService.generateSessionToken()

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
      it('should refresh session correctly', async () => {
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
              accessTokenExpiresAt: expect.any(String),
              refreshTokenExpiresAt: expect.any(String),
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

        it('should return UnauthorizedException when request does not include refresh token', async () => {
          await testCase('')
        })

        it('should return UnauthorizedException when session is not found', async () => {
          await userDatabaseHelper.save(rawUser)

          await testCase(`${refreshCookieName}=another-refresh-token`)
        })

        it('should return UnauthorizedException when user is not active', async () => {
          await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().toString() })
          await userSessionDatabaseHelper.save(rawCurrentSession)

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should return UnauthorizedException when user associated is deleted', async () => {
          await userDatabaseHelper.save({ ...rawUser, deleted_at: now })
          await userSessionDatabaseHelper.save(rawCurrentSession)

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should return UnauthorizedException when session is already expired', async () => {
          await userDatabaseHelper.save(rawUser)
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: pastExpiresAt, revoked_at: null })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })

        it('should return UnauthorizedException when session is already revoked', async () => {
          await userDatabaseHelper.save(rawUser)
          await userSessionDatabaseHelper.save({ ...rawCurrentSession, expires_at: futureExpiresAt, revoked_at: now })

          await testCase(`${refreshCookieName}=${inputToken}`)
        })
      })
    })
  })

  describe('verify email', () => {
    const futureExpiresAt = new Date(now.getTime() + 3600 * 1000)

    // TODO: Change email's domain when we get Postmark approval
    const userEmail = 'recipient@cponton.com'
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
      it('should generate verification token correctly for signup', async () => {
        return request(app.getHttpServer()).post('/auth/verify-email/signup').send(validBody).expect(204)
      })

      it('should generate verification token correctly for reset', async () => {
        await userDatabaseHelper.save(rawUser)
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
