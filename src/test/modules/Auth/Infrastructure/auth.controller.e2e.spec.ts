import { DataSource, Repository } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from '~/src/modules/Auth/Infrastructure/auth.module'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { BCryptPasswordHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptPasswordHasherService'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import {
  UserCredentialEntity,
  UserCredentialRawWitRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
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
import { AUTH_LOGIN_UNAUTHORIZED } from '~/src/modules/Auth/Infrastructure/ApiCodes'

describe('AuthController', () => {
  let app: NestFastifyApplication
  let dataSource: DataSource

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    dataSource = global.dataSource

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, RateLimitModule, SharedModule, DatabaseModule, AuthModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile()

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    app.useGlobalPipes(validationPipe)
    await app.register(fastifyCookie)
    await app.init()

    await app.getHttpAdapter().getInstance().ready()
  })

  afterEach(async () => {
    const entities = dataSource.entityMetadatas
    const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ')

    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('login', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.random()
    const passwordHasher = new BCryptPasswordHasherService(1)
    let userRepository: Repository<UserRawModelWithRelations>
    let userCredentialRepository: Repository<UserCredentialRawWitRelationships>

    let rawUser: UserRawModelWithRelations
    let rawCredential: UserCredentialRawWitRelationships

    beforeEach(async () => {
      userRepository = dataSource.manager.getRepository(UserEntity)
      userCredentialRepository = dataSource.manager.getRepository(UserCredentialEntity)

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
        await userRepository.save(rawUser)
        await userCredentialRepository.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'expected-password' })
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
                sessionId: expect.any(String),
                accessTokenExpiresAt: expect.any(String),
                refreshTokenExpiresAt: expect.any(String),
                isNewDevice: expect.any(Boolean),
              }),
            )

            const cookies = response.headers['set-cookie']
            expect(cookies).toBeDefined()

            expect(cookies).toEqual(
              expect.arrayContaining([expect.stringContaining('x-access-token='), expect.stringContaining('x-refresh-token=')]),
            )
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
            expect(response.body.code).toEqual('VALIDATION_ERROR')
            expect(response.body.errors).toBeInstanceOf(Object)

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const errorMessages = Object.keys(response.body.errors).join(' ')

            expect(errorMessages).toContain('email')
            expect(errorMessages).toContain('password')
            expect(errorMessages).toContain('page')
            expect(errorMessages).toContain('perPage')
          })
      })

      it('should return 401 if user is not found', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'expected-password' })
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                code: AUTH_LOGIN_UNAUTHORIZED,
                message: 'Unauthorized access',
                status: 401,
                traceId: expect.any(String),
              }),
            )
          })
      })

      it('should return 401 if user is not active', async () => {
        await userRepository.save({ ...rawUser, status: UserStatus.deactivated().toString() })
        await userCredentialRepository.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'expected-password' })
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                code: AUTH_LOGIN_UNAUTHORIZED,
                message: 'Unauthorized access',
                status: 401,
                traceId: expect.any(String),
              }),
            )
          })
      })

      it('should return 401 if user does not have credentials', async () => {
        await userRepository.save(rawUser)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'expected-password' })
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                code: AUTH_LOGIN_UNAUTHORIZED,
                message: 'Unauthorized access',
                status: 401,
                traceId: expect.any(String),
              }),
            )
          })
      })

      it('should return 401 if user password does not match', async () => {
        await userRepository.save(rawUser)
        await userCredentialRepository.save(rawCredential)

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: userEmail.toString(), password: 'another-password' })
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual(
              expect.objectContaining<Record<string, unknown>>({
                code: AUTH_LOGIN_UNAUTHORIZED,
                message: 'Unauthorized access',
                status: 401,
                traceId: expect.any(String),
              }),
            )
          })
      })
    })
  })
})
