import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { ConfigService } from '@nestjs/config'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

describe('LoginUser', () => {
  const now = new Date('2025-10-22T19:00:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)

  const userId = IdentifierMother.valid().value
  const userEmail = EmailAddressMother.random().value
  const validPassword = UserPasswordMother.random().value

  const userAgent = UserAgentMother.random()
  const userDeviceLocation = DeviceLocationMother.valid()
  const userIpHash = UserIpHashMother.random()
  const userDomainAggregateType = DomainEventAggregateType.user().value

  let userDatabaseHelper: UserDatabaseHelper
  let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

  let baseRequest: LoginUserApplicationRequestDto

  const ACCESS_TTL_MS = env.ACCESS_TTL_MS
  const REFRESH_TTL_MS = env.REFRESH_TTL_MS

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockReset(mockedConfigService)

    mockedConfigService.get.mockImplementation(createConfigServiceMockImplementation({ REFRESH_TTL_MS, ACCESS_TTL_MS }))

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    const rawUser = makeRawUser({
      id: userId,
      email: userEmail,
      status: UserStatus.active().value,
    })
    await userDatabaseHelper.save(rawUser)

    const userPassword = await passwordHasher.hash(validPassword)

    const rawUserCredential = makeRawUserCredential({
      user_id: userId,
      password_hash: userPassword,
      locked_until: null,
      last_login_at: null,
    })
    await userCredentialDatabaseHelper.save(rawUserCredential)

    baseRequest = {
      email: userEmail,
      password: validPassword,
      clientMetadata: new ClientMetadataResponseTestBuilder()
        .withUserAgent(userAgent)
        .withUserIpHash(userIpHash)
        .withDeviceLocation(userDeviceLocation)
        .build(),
    }
  })

  const mockedConfigService = mock<ConfigService>()
  const passwordHasher = new BCryptHasherService(env.SALT_ROUNDS)
  const hasherService = new HmacHasherService(env.HASH_SECRET)
  const idGenerator = new NodeIdGeneratorService()
  const domainEventFactory = new AuthDomainEventFactory(idGenerator)
  const loggerService = new LoggerServiceMock()
  const maxSessions = env.USER_MAX_SESSIONS

  const buildUseCase = () => {
    return new LoginUser(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserCredentialRepository(mockedResolver),
      new PostgreSqlUserSessionRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      passwordHasher,
      new GenerateTokensApplicationService(
        idGenerator,
        new JWTokenGeneratorApplicationService(env.ACCESS_SECRET, env.ACCESS_ISSUER, env.ACCESS_AUDIENCE),
        hasherService,
        mockedConfigService,
      ),
      new UserSessionPolicyManagerApplicationService(new MaxSessionsPolicy(maxSessions), loggerService),
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      domainEventFactory,
    )
  }

  const runTestWithCount = async (
    request: LoginUserApplicationRequestDto,
    expectedCounts: {
      sessions: { before: number; after: number }
      events: { before: number; after: number }
      credentials?: { before: number; after: number }
    },
  ) => {
    const useCase = buildUseCase()

    const userCredentialBefore = await userCredentialDatabaseHelper.count()
    const sessionsBeforeLogin = await userSessionDatabaseHelper.count()
    const eventsBeforeLogin = await domainEventDatabaseHelper.count()

    const result = await useCase.execute(request)

    const sessionsAfterLogin = await userSessionDatabaseHelper.count()
    const eventsAfterLogin = await domainEventDatabaseHelper.count()
    const userCredentialAfter = await userCredentialDatabaseHelper.count()

    expect(sessionsBeforeLogin).toEqual(expectedCounts.sessions.before)
    expect(sessionsAfterLogin).toEqual(expectedCounts.sessions.after)
    expect(eventsBeforeLogin).toEqual(expectedCounts.events.before)
    expect(eventsAfterLogin).toEqual(expectedCounts.events.after)

    if (expectedCounts.credentials) {
      expect(userCredentialBefore).toEqual(expectedCounts.credentials.before)
      expect(userCredentialAfter).toEqual(expectedCounts.credentials.after)
    } else {
      expect(userCredentialBefore).toEqual(1)
      expect(userCredentialAfter).toEqual(1)
    }

    return result
  }

  describe('happy path', () => {
    const assertResult = (result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>, newDevice: boolean) => {
      expect(result).toEqual({
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: expect.objectContaining<Record<string, unknown>>({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          sessionId: expect.any(String),
          accessTokenExpiresAt: new Date(now.getTime() + ACCESS_TTL_MS),
          refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
          isNewDevice: newDevice,
        }),
      })
    }

    const assertSavedSessionDomainAndCredential = async (
      result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>,
      expectedUserAgent: UserAgent,
      expectedIpHash: UserIpHash | null,
      expectedDeviceLocation: DeviceLocation | null,
    ) => {
      expect(result.success).toBe(true)

      const sessionId: string = result['value'].sessionId as string
      const expectedSessionHash = await hasherService.hash(result['value'].refreshToken as string)

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const savedSession = userActiveSessions.find((savedSession) => savedSession.id === sessionId)
      expect(savedSession).toBeDefined()
      expect(savedSession!.id).toBe(sessionId)
      expect(savedSession!.user_id).toBe(userId)
      expect(savedSession!.user_agent).toEqual(expectedUserAgent.value)

      if (!expectedIpHash) {
        expect(savedSession!.ip_hash).toBeNull()
      } else {
        expect(savedSession!.ip_hash).toBe(expectedIpHash.value)
      }

      if (!expectedDeviceLocation) {
        expect(savedSession!.device_country_code).toBeNull()
        expect(savedSession!.device_city).toBeNull()
      } else {
        expect(savedSession!.device_country_code).toBe(expectedDeviceLocation.countryCode)
        expect(savedSession!.device_city).toBe(expectedDeviceLocation.city)
      }

      expect(savedSession!.token_hash).toBe(expectedSessionHash)
      expect(savedSession!.expires_at).toEqual(new Date(now.getTime() + REFRESH_TTL_MS))

      const userDomainEvents = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, userDomainAggregateType)

      const savedDomainEvent = userDomainEvents.find(
        (savedDomainEvent) => savedDomainEvent.name === String(DomainEventName.successfulLogin().value),
      )
      expect(savedDomainEvent).toBeDefined()
      expect(savedDomainEvent!.aggregate_id).toBe(userId)
      expect(savedDomainEvent!.aggregate_type).toBe(userDomainAggregateType)
      expect(savedDomainEvent!.name).toBe(DomainEventName.successfulLogin().value)
      expect(savedDomainEvent!.occurred_at).toEqual(now)

      const updatedUserCredential = await userCredentialDatabaseHelper.findUserCredential(userId)
      expect(updatedUserCredential).not.toBeNull()
      expect(updatedUserCredential!.updated_at).toEqual(now)
      expect(updatedUserCredential!.failed_attempts).toBe(0)
      expect(updatedUserCredential!.locked_until).toBeNull()
      expect(updatedUserCredential!.last_login_at).toEqual(now)
    }

    it('should create a new user session and its domain event correctly (no revoke sessions)', async () => {
      const result = await runTestWithCount(baseRequest, {
        sessions: { before: 0, after: 1 },
        events: { before: 0, after: 1 },
      })

      assertResult(result, true)

      await assertSavedSessionDomainAndCredential(result, userAgent, userIpHash, userDeviceLocation)
    })

    it('should create a new user session and its domain event correctly (revoke sessions)', async () => {
      const oldestCreatedAt = new Date(now.getTime() - 3000)
      const middleCreatedAt = new Date(now.getTime() - 2000)
      const newestCreatedAt = new Date(now.getTime() - 1000)

      const oldestSession = makeRawSession({ user_id: userId, created_at: oldestCreatedAt, expires_at: futureExpiresAt })
      const session2 = makeRawSession({ user_id: userId, created_at: middleCreatedAt, expires_at: futureExpiresAt })
      const session3 = makeRawSession({
        user_id: userId,
        created_at: newestCreatedAt,
        expires_at: futureExpiresAt,
        user_agent: userAgent.value,
        ip_hash: userIpHash.value,
      })

      await userSessionDatabaseHelper.save([oldestSession, session2, session3])

      const result = await runTestWithCount(baseRequest, {
        sessions: { before: 3, after: 4 },
        events: { before: 0, after: 1 },
      })

      assertResult(result, false)

      await assertSavedSessionDomainAndCredential(result, userAgent, userIpHash, userDeviceLocation)

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(userActiveSessions).toHaveLength(maxSessions)

      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === session2.id)).toBeDefined()
      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === session3.id)).toBeDefined()
      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === oldestSession.id)).toBeUndefined()

      const updatedOldestSession = await userSessionDatabaseHelper.findById(oldestSession.id)
      expect(updatedOldestSession).not.toBeNull()
      expect(updatedOldestSession?.revoked_at).toEqual(now)
      expect(updatedOldestSession?.updated_at).toEqual(now)
    })
  })

  describe('when there are errors', () => {
    it('should return error when password is incorrect', async () => {
      const anotherPassword = UserPasswordMother.random()

      const result = await runTestWithCount(
        { ...baseRequest, password: anotherPassword.value },
        {
          sessions: { before: 0, after: 0 },
          events: { before: 0, after: 1 },
        },
      )

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidCredentials(userId))

      const savedDomainEvents = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, userDomainAggregateType)

      expect(savedDomainEvents).toHaveLength(1)
      expect(savedDomainEvents[0].name).toEqual(DomainEventName.failedLoginAttempt().value)
      expect(savedDomainEvents[0].occurred_at).toEqual(now)
    })

    describe('when user is not found or is disabled', () => {
      it('should return error when user is not found', async () => {
        const anotherUserEmail = EmailAddressMother.random()

        const result = await runTestWithCount(
          { ...baseRequest, email: anotherUserEmail.value },
          {
            sessions: { before: 0, after: 0 },
            events: { before: 0, after: 0 },
          },
        )

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userNotFound(anotherUserEmail.value))
      })

      it('should return error when user is not active', async () => {
        await userDatabaseHelper.update(userId, { status: UserStatus.deactivated().value })

        const result = await runTestWithCount(baseRequest, {
          sessions: { before: 0, after: 0 },
          events: { before: 0, after: 0 },
        })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userDisabled(userEmail))
      })
    })

    it('should return error when user does not have credentials', async () => {
      await userCredentialDatabaseHelper.delete(userId)

      const result = await runTestWithCount(baseRequest, {
        sessions: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
        credentials: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.userDoesNotHaveCredentials(userId))
    })
  })
})
