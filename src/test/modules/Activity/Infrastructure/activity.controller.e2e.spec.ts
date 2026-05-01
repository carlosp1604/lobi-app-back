import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { ActivityDatabaseHelper } from '~/src/test/modules/Activity/Infrastructure/helpers/ActivityDatabaseHelper'
import { ParticipationDatabaseHelper } from '~/src/test/modules/Activity/Infrastructure/helpers/ParticipationDatabaseHelper'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DataSource } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { SentryExceptionFilter } from '~/src/modules/Shared/Infrastructure/sentry-exception.filter'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { ContextModule } from '~/src/modules/Shared/Infrastructure/context.module'
import { LoggerModule } from '~/src/modules/Shared/Infrastructure/logger.module'
import { RateLimitModule } from '~/src/modules/Shared/Infrastructure/rate-limit.module'
import { SharedModule } from '~/src/modules/Shared/Infrastructure/shared.module'
import { DatabaseModule } from '~/src/db/database.module'
import { validationPipe } from '~/src/modules/Shared/Infrastructure/global-validation.pipe'
import fastifyCookie from '@fastify/cookie'
import { ActivityModule } from '~/src/modules/Activity/Infrastructure/activity.module'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { TOKEN_GENERATOR } from '~/src/modules/Auth/Infrastructure/auth.tokens'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { ActivityTitleMother } from '~/src/test/mothers/Domain/Activity/ActivityTitleMother'
import { ActivityScheduledDateMother } from '~/src/test/mothers/Domain/Activity/ActivityScheduledDateMother'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { CreateActivityBodyDto } from '~/src/modules/Activity/Infrastructure/Dtos/create-activity-body.dto'
import request from 'supertest'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { UNAUTHORIZED_ACCESS, VALIDATION_ERROR } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { expectIsoDate } from '~/src/test/utils/matchers'
import { ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND } from '~/src/modules/Activity/Infrastructure/ApiCodes'
import { CreateActivityApplicationError } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'
import { makeRawSport } from '~/src/test/modules/Activity/Infrastructure/RawSportTestMaker'
import { SportDatabaseHelper } from '~/src/test/modules/Activity/Infrastructure/helpers/SportDatabaseHelper'
import { SlugMother } from '~/src/test/mothers/Domain/Shared/SlugMother'

describe('ActivityController', () => {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 3600 * 1000)

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
        ContextModule,
        LoggerModule,
        RateLimitModule,
        SharedModule,
        DatabaseModule,
        ActivityModule,
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
    jest.clearAllMocks()

    const entities = dataSource.entityMetadatas
    const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ')

    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('create', () => {
    const userId = IdentifierMother.validString()
    const sessionId = IdentifierMother.validString()
    const sportId = IdentifierMother.validString()
    const activityTitle = ActivityTitleMother.validString()
    const scheduledDate = ActivityScheduledDateMother.validDate(now)

    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper
    let activityDatabaseHelper: ActivityDatabaseHelper
    let participationDatabaseHelper: ParticipationDatabaseHelper
    let tokenService: TokenGeneratorApplicationServiceInterface

    const getValidRequest = (): CreateActivityBodyDto => ({
      sportId: sportId,
      title: activityTitle,
      description: null,
      scheduledDate,
      config: {
        capabilities: {},
        specs: {
          participants: {
            minPlayersToPlay: 2,
          },
        },
      },
    })

    beforeEach(async () => {
      userDatabaseHelper = new UserDatabaseHelper(dataSource.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(dataSource.manager)
      activityDatabaseHelper = new ActivityDatabaseHelper(dataSource.manager)
      participationDatabaseHelper = new ParticipationDatabaseHelper(dataSource.manager)
      tokenService = app.get<TokenGeneratorApplicationServiceInterface>(TOKEN_GENERATOR)

      const sportDatabaseHelper = new SportDatabaseHelper(dataSource.manager)
      const rawSport = makeRawSport({ id: sportId })
      await sportDatabaseHelper.save(rawSport)
    })

    const saveSetupInDatabase = async () => {
      const rawUser = makeRawUser({ id: userId })
      const rawSession = makeRawSession({
        id: sessionId,
        user_id: userId,
        revoked_at: null,
        expires_at: futureDate,
      })

      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save(rawSession)

      const accessToken = await tokenService.generateAccessToken(rawSession.user_id, rawSession.id, rawSession.expires_at, now)

      return { rawUser, accessToken }
    }

    describe('happy path', () => {
      it('should return 201 and persist data when activity is created successfully', async () => {
        const payload = getValidRequest()

        const { accessToken } = await saveSetupInDatabase()

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        const response = await request(app.getHttpServer())
          .post('/activity')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .send(payload)
          .expect(201)

        expect(response.body).toEqual({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          activity: expect.any(Object),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          participation: expect.any(Object),
          isUserAdmin: true,
          isUserParticipating: true,
        })

        const activityId = response.body.activity.id as string
        const participationId = response.body.participation.id as string

        const savedActivity = await activityDatabaseHelper.findById(activityId)
        expect(savedActivity).toBeDefined()
        expect(savedActivity?.title).toBe(payload.title)
        expect(savedActivity?.sport_id).toBe(sportId)

        const savedParticipation = await participationDatabaseHelper.findById(participationId)
        expect(savedParticipation).toBeDefined()
        expect(savedParticipation?.user_id).toBe(userId)
        expect(savedParticipation?.activity_id).toBe(activityId)
      })
    })

    describe('when there are errors', () => {
      it('should throw 401 UnauthorizedException when user is not authenticated', async () => {
        return request(app.getHttpServer())
          .post('/activity')
          .send(getValidRequest())
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/activity',
              response: {
                code: UNAUTHORIZED_ACCESS,
                message: 'Unauthorized access',
              },
              statusCode: 401,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw 400 error when body is not valid', async () => {
        const invalidPayload = {
          title: 1234,
          description: 1345,
        }

        const { accessToken } = await saveSetupInDatabase()

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .post('/activity')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .send(invalidPayload)
          .expect(400)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/activity',
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

            expect(errorMessages).toContain('sportId')
            expect(errorMessages).toContain('title')
            expect(errorMessages).toContain('description')
            expect(errorMessages).toContain('scheduledDate')
            expect(errorMessages).toContain('config')
          })
      })

      it('should throw 422 UnprocessableEntityException when sport does not exist', async () => {
        const payloadWithInvalidSport = getValidRequest()
        payloadWithInvalidSport.sportId = IdentifierMother.validString()

        const { accessToken } = await saveSetupInDatabase()

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        return request(app.getHttpServer())
          .post('/activity')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .send(payloadWithInvalidSport)
          .expect(422)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/activity',
              response: {
                code: ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
                message: CreateActivityApplicationError.sportNotFound().message,
              },
              statusCode: 422,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })

      it('should throw 401 UnauthorizedException when user does not exist', async () => {
        const { rawUser, accessToken } = await saveSetupInDatabase()

        const accessCookieName = configService.get<string>('ACCESS_COOKIE_NAME', { infer: true })

        await userDatabaseHelper.remove(rawUser)

        return request(app.getHttpServer())
          .post('/activity')
          .set('Cookie', [`${accessCookieName}=${accessToken}`])
          .send(getValidRequest())
          .expect(401)
          .expect((response) => {
            expect(response.body).toEqual({
              path: '/activity',
              response: {
                code: UNAUTHORIZED_ACCESS,
                message: 'Unauthorized access',
              },
              statusCode: 401,
              requestId: expect.any(String),
              timestamp: expectIsoDate,
            } as Record<string, unknown>)
          })
      })
    })
  })

  describe('getSports', () => {
    let sportDatabaseHelper: SportDatabaseHelper

    beforeEach(() => {
      sportDatabaseHelper = new SportDatabaseHelper(dataSource.manager)
    })

    describe('happy path', () => {
      it('should return 200 and a list containing the registered sports', async () => {
        const sport1Id = IdentifierMother.validString()
        const sport2Id = IdentifierMother.validString()

        const rawSport1 = makeRawSport({ id: sport1Id, slug: SlugMother.randomString() })
        const rawSport2 = makeRawSport({ id: sport2Id, slug: SlugMother.randomString() })

        await sportDatabaseHelper.save(rawSport1)
        await sportDatabaseHelper.save(rawSport2)

        const response = await request(app.getHttpServer()).get('/activity/sports').expect(200)

        expect(response.body).toEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            sports: expect.arrayContaining([expect.objectContaining({ id: sport1Id }), expect.objectContaining({ id: sport2Id })]),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            count: expect.any(Number),
          }),
        )

        expect(response.body.count).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
