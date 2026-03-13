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
import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { IpAddressIpValidatorService } from '~/src/modules/Shared/Infrastructure/Services/IpAddressIpValidatorService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
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
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

interface BuildAndSaveSessionsResponse {
  oldestSession: UserSessionRawWithRelationships
  session2: UserSessionRawWithRelationships
  session3: UserSessionRawWithRelationships
}

describe('LoginUser', () => {
  const now = new Date('2025-10-22T19:00:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)

  const userId = IdentifierMother.valid().value
  const userEmail = EmailAddressMother.random().value
  const expectedUserAgent = UserAgentMother.random()
  const domainType = DomainEventAggregateType.user().value
  const validPassword = UserPasswordMother.random().value

  let userDatabaseHelper: UserDatabaseHelper
  let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

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
  })

  const mockedConfigService = mock<ConfigService>()
  const passwordHasher = new BCryptHasherService(env.SALT_ROUNDS)
  const hasherService = new HmacHasherService(env.HASH_SECRET)
  const idGenerator = new NodeIdGeneratorService()
  const domainEventFactory = new AuthDomainEventFactory(idGenerator)
  const loggerService = new LoggerServiceMock()
  const maxSessions = env.USER_MAX_SESSIONS

  const request: LoginUserApplicationRequestDto = {
    email: userEmail,
    password: validPassword,
    ip: '127.0.0.0',
    userAgent: expectedUserAgent.value,
  }

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
      new RequestOriginApplicationService(
        new IpAddressIpValidatorService(),
        hasherService,
        new NoopDeviceLocationResolverService(),
        loggerService,
      ),
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      domainEventFactory,
    )
  }

  const buildAndSaveSessions = async (sameSession?: {
    ipHash: UserSessionIpHash
    userAgent: UserAgent
  }): Promise<BuildAndSaveSessionsResponse> => {
    const oldestCreatedAt = new Date(now.getTime() - 3000)
    const middleCreatedAt = new Date(now.getTime() - 2000)
    const newestCreatedAt = new Date(now.getTime() - 1000)

    const oldestSession = makeRawSession({ user_id: userId, created_at: oldestCreatedAt, expires_at: futureExpiresAt })
    const session2 = makeRawSession({ user_id: userId, created_at: middleCreatedAt, expires_at: futureExpiresAt })
    const session3 = makeRawSession({
      user_id: userId,
      created_at: newestCreatedAt,
      expires_at: futureExpiresAt,
      user_agent: sameSession ? sameSession.userAgent.value : UserAgentMother.random().value,
      ip_hash: sameSession ? sameSession.ipHash.value : UserSessionIpHashMother.random().value,
    })

    await userSessionDatabaseHelper.save([oldestSession, session2, session3])

    return {
      oldestSession,
      session2,
      session3,
    }
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
      activeSessions: Array<UserSessionRawWithRelationships>,
      domainEvents: Array<DomainEventRawModel>,
      userAgent: UserAgent,
      ipHash: UserSessionIpHash | null,
    ) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const sessionId: string = result.value!.sessionId as string
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const expectedSessionHash = await hasherService.hash(result.value!.refreshToken as string)

      const savedSession = UserSessionDatabaseHelper.findSessionByIdInArray(activeSessions, sessionId)
      expect(savedSession).toBeDefined()
      expect(savedSession!.user_id).toBe(userId)
      expect(savedSession!.user_agent).toBe(userAgent.value)

      if (!ipHash) {
        expect(savedSession!.ip_hash).toBeNull()
      } else {
        expect(savedSession!.ip_hash).toBe(ipHash.value)
      }

      expect(savedSession!.device_country_code).toBeNull()
      expect(savedSession!.device_city).toBeNull()
      expect(savedSession!.token_hash).toBe(expectedSessionHash)
      expect(savedSession!.expires_at).toEqual(new Date(now.getTime() + REFRESH_TTL_MS))

      expect(domainEvents.length).toBe(1)
      expect(domainEvents[0].name).toBe(DomainEventName.successfulLogin().value)

      const updatedUserCredential = await userCredentialDatabaseHelper.findUserCredential(userId)
      expect(updatedUserCredential).not.toBeNull()
      expect(updatedUserCredential!.updated_at).toEqual(now)
      expect(updatedUserCredential!.failed_attempts).toBe(0)
      expect(updatedUserCredential!.locked_until).toBeNull()
      expect(updatedUserCredential!.last_login_at).toEqual(now)
    }

    it('should authenticate and create a new user session correctly (no revoke sessions)', async () => {
      const useCase = buildUseCase()

      const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      assertResult(result, true)

      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsBefore).toEqual([])
      expect(activeSessionsBefore.length).toBe(0)
      expect(activeSessionsBefore).toEqual([])

      expect(activeSessionsAfter.length).toBe(1)
      await assertSavedSessionDomainAndCredential(result, activeSessionsAfter, domainEventsAfter, expectedUserAgent, null)
    })

    it('should authenticate and create a new user session correctly (revoke sessions)', async () => {
      const ipHash = await hasherService.hash('8.8.8.8')
      const expectedIpHash = UserSessionIpHash.fromString(ipHash)
      const userAgent = UserAgentMother.valid()

      const { oldestSession, session2, session3 } = await buildAndSaveSessions({
        ipHash: UserSessionIpHash.fromString(ipHash),
        userAgent,
      })

      const useCase = buildUseCase()

      const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute({ ...request, ip: '8.8.8.8', userAgent: userAgent.value })

      const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      assertResult(result, false)

      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsBefore).toEqual([])
      expect(activeSessionsBefore.length).toBe(3)
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, oldestSession.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, session2.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, session3.id)).toBeDefined()

      expect(activeSessionsAfter.length).toBe(maxSessions)
      await assertSavedSessionDomainAndCredential(result, activeSessionsAfter, domainEventsAfter, userAgent, expectedIpHash)

      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsAfter, session2.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsAfter, session3.id)).toBeDefined()

      const oldestSessionInDb = await userSessionDatabaseHelper.findById(oldestSession.id)
      expect(oldestSessionInDb).not.toBeNull()
      expect(oldestSessionInDb?.revoked_at).toEqual(now)
      expect(oldestSessionInDb?.updated_at).toEqual(now)
    })
  })

  describe('when there are errors', () => {
    it('should return error when password is incorrect', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const userCredentialBefore = await userCredentialDatabaseHelper.findUserCredential(userId)

      const result = await useCase.execute({ ...request, password: UserPasswordMother.random().value })

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const userCredentialAfter = await userCredentialDatabaseHelper.findUserCredential(userId)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LoginUserApplicationError.invalidCredentials(userId))

      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsBefore).toEqual([])

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
      expect(userCredentialBefore).toEqual(userCredentialAfter)

      expect(domainEventsAfter[0].name).toEqual(DomainEventName.failedLoginAttempt().value)
      expect(domainEventsAfter[0].occurred_at).toEqual(now)
    })

    describe('when user is not found or is deactivated', () => {
      const testCase = async (request: LoginUserApplicationRequestDto) => {
        const useCase = buildUseCase()

        const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)
        const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
        const userCredentialBefore = await userCredentialDatabaseHelper.findUserCredential(userId)

        const result = await useCase.execute(request)

        const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)
        const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
        const userCredentialAfter = await userCredentialDatabaseHelper.findUserCredential(userId)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(LoginUserApplicationError.userNotFound(request.email))

        expect(domainEventsBefore.length).toBe(0)
        expect(domainEventsBefore).toEqual([])

        expect(activeSessionsBefore).toEqual(activeSessionsAfter)
        expect(userCredentialBefore).toEqual(userCredentialAfter)
        expect(domainEventsAfter).toEqual(domainEventsBefore)
      }

      it('should return error when user is not found', async () => {
        const anotherUserEmail = EmailAddressMother.random()

        await testCase({ ...request, email: anotherUserEmail.value })
      })

      it('should return error when user is not active', async () => {
        await userDatabaseHelper.update(userId, { status: UserStatus.deactivated().value })

        await testCase(request)
      })
    })

    it('should return error when user does not have credentials', async () => {
      await userCredentialDatabaseHelper.delete(userId)

      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const userCredentialBefore = await userCredentialDatabaseHelper.findUserCredential(userId)

      const result = await useCase.execute(request)

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.userDoesNotHaveCredentials(userId),
      })

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateTypeAndId(userId, domainType)
      const userCredentialAfter = await userCredentialDatabaseHelper.findUserCredential(userId)

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
      expect(domainEventsBefore).toEqual(domainEventsAfter)
      expect(userCredentialBefore).toBeNull()
      expect(userCredentialAfter).toBeNull()
    })

    describe('when there are errors during session revocation', () => {})
  })
})
