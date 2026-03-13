import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { QueryRunner } from 'typeorm'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { ConfigService } from '@nestjs/config'
import { RefreshSession } from '~/src/modules/Auth/Application/RefreshSession/RefreshSession'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { RefreshSessionApplicationResponseDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationResponseDto'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { IpAddressIpValidatorService } from '~/src/modules/Shared/Infrastructure/Services/IpAddressIpValidatorService'
import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'

interface BuildAndSaveSessionsResponse {
  oldestSession: UserSessionRawWithRelationships
  session2: UserSessionRawWithRelationships
  session3: UserSessionRawWithRelationships
}

describe('RefreshSession', () => {
  const now = new Date('2025-10-23T11:00:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const pastExpiresAt = new Date(now.getTime() - 3600)

  const userId = IdentifierMother.valid().value
  const expectedUserAgent = UserAgentMother.random().raw

  let userDatabaseHelper: UserDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper

  const mockedConfigService = mock<ConfigService>()
  const hasherService = new HmacHasherService(env.HASH_SECRET)
  const jwtGenerator = new JWTokenGeneratorApplicationService(env.ACCESS_SECRET, env.ACCESS_ISSUER, env.ACCESS_AUDIENCE)

  const ACCESS_TTL_MS = env.ACCESS_TTL_MS
  const REFRESH_TTL_MS = env.REFRESH_TTL_MS
  const maxSessions = env.USER_MAX_SESSIONS

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  let request: RefreshSessionApplicationRequestDto
  let currentSession: UserSessionRawWithRelationships
  let hashedIp: string

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockReset(mockedConfigService)

    mockedConfigService.get.mockImplementation(createConfigServiceMockImplementation({ REFRESH_TTL_MS, ACCESS_TTL_MS }))
    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

    const rawUser = makeRawUser({
      id: userId,
      status: UserStatus.active().value,
      deleted_at: null,
    })

    await userDatabaseHelper.save(rawUser)

    const refreshToken = await jwtGenerator.generateSessionToken()
    const hashedToken = await hasherService.hash(refreshToken)

    currentSession = makeRawSession({
      user_id: userId,
      token_hash: hashedToken,
      user_agent: UserAgentMother.random().raw,
      ip_hash: UserSessionIpHashMother.random().value,
      expires_at: futureExpiresAt,
      revoked_at: null,
      created_at: now,
      device_country_code: null,
      device_city: null,
    })
    await userSessionDatabaseHelper.save(currentSession)

    request = {
      token: refreshToken,
      ip: '8.8.8.8',
      userAgent: expectedUserAgent,
    }

    hashedIp = await hasherService.hash(request.ip)
  })

  const buildUseCase = () => {
    return new RefreshSession(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserSessionRepository(mockedResolver),
      hasherService,
      new GenerateTokensApplicationService(
        new NodeIdGeneratorService(),
        new JWTokenGeneratorApplicationService(env.ACCESS_SECRET, env.ACCESS_ISSUER, env.ACCESS_AUDIENCE),
        hasherService,
        mockedConfigService,
      ),
      new UserSessionPolicyManagerApplicationService(new MaxSessionsPolicy(maxSessions), new LoggerServiceMock()),
      new RequestOriginApplicationService(
        new IpAddressIpValidatorService(),
        hasherService,
        new NoopDeviceLocationResolverService(),
        new LoggerServiceMock(),
      ),
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      new LoggerServiceMock(),
    )
  }

  const buildAndSaveSessions = async (): Promise<BuildAndSaveSessionsResponse> => {
    const middleCreatedAt = new Date(now.getTime() - 2000)
    const newestCreatedAt = new Date(now.getTime() - 1000)
    const oldestCreatedAt = new Date(now.getTime() - 3000)

    const session2 = makeRawSession({ user_id: userId, created_at: middleCreatedAt, expires_at: futureExpiresAt })
    const session3 = makeRawSession({ user_id: userId, created_at: newestCreatedAt, expires_at: futureExpiresAt })
    const oldestSession = makeRawSession({ user_id: userId, created_at: oldestCreatedAt, expires_at: futureExpiresAt })

    await userSessionDatabaseHelper.save([oldestSession, session2, session3])

    return {
      oldestSession,
      session2,
      session3,
    }
  }

  describe('happy path', () => {
    const assertResult = (result: Result<RefreshSessionApplicationResponseDto, RefreshSessionApplicationError>) => {
      expect(result).toEqual({
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: expect.objectContaining<Record<string, unknown>>({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          sessionId: expect.any(String),
          accessTokenExpiresAt: new Date(now.getTime() + ACCESS_TTL_MS),
          refreshTokenExpiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
        }),
      })
    }

    const assertSavedAndRevokeSession = async (
      result: Result<RefreshSessionApplicationResponseDto, RefreshSessionApplicationError>,
      activeSessions: Array<UserSessionRawWithRelationships>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const sessionId: string = result.value!.sessionId as string
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const expectedSessionHash = await hasherService.hash(result.value!.refreshToken as string)

      const currentSessionInDb = await userSessionDatabaseHelper.findById(currentSession.id)

      expect(currentSessionInDb).not.toBeNull()
      expect(currentSessionInDb!.revoked_at).not.toBeNull()
      expect(currentSessionInDb!.revoked_at).toEqual(now)
      expect(currentSessionInDb!.updated_at).toEqual(now)

      const savedSession = UserSessionDatabaseHelper.findSessionByIdInArray(activeSessions, sessionId)
      expect(savedSession).toBeDefined()
      expect(savedSession!.user_id).toBe(userId)
      expect(savedSession!.user_agent).toBe(expectedUserAgent)

      expect(savedSession!.ip_hash).toBe(hashedIp)

      expect(savedSession!.device_country_code).toBeNull()
      expect(savedSession!.device_city).toBeNull()
      expect(savedSession!.token_hash).toBe(expectedSessionHash)
      expect(savedSession!.expires_at).toEqual(new Date(now.getTime() + REFRESH_TTL_MS))
    }

    it('should revoke current session and create a new user session correctly (no revoke sessions)', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      assertResult(result)

      expect(activeSessionsBefore.length).toBe(1)
      expect(activeSessionsBefore).toEqual([currentSession])

      expect(activeSessionsAfter.length).toBe(1)
      await assertSavedAndRevokeSession(result, activeSessionsAfter)
    })

    it('should revoke current session and create a new user session correctly (revoke sessions)', async () => {
      const { oldestSession, session2, session3 } = await buildAndSaveSessions()

      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      assertResult(result)

      expect(activeSessionsBefore.length).toBe(4)
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, oldestSession.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, session2.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, session3.id)).toBeDefined()
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsBefore, currentSession.id)).toBeDefined()

      expect(activeSessionsAfter.length).toBe(maxSessions)
      await assertSavedAndRevokeSession(result, activeSessionsAfter)

      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsAfter, session2.id))
      expect(UserSessionDatabaseHelper.findSessionByIdInArray(activeSessionsAfter, session3.id))

      const oldestSessionInDb = await userSessionDatabaseHelper.findById(oldestSession.id)
      expect(oldestSessionInDb).not.toBeNull()
      expect(oldestSessionInDb?.revoked_at).toEqual(now)
      expect(oldestSessionInDb?.updated_at).toEqual(now)
    })
  })

  describe('when there are errors', () => {
    it('should return error when session is not found', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const anotherRefreshToken = await jwtGenerator.generateSessionToken()
      const result = await useCase.execute({ ...request, token: anotherRefreshToken })

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionNotFound())

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
    })

    it('should return error when session is already expired', async () => {
      await userSessionDatabaseHelper.update(currentSession.id, { expires_at: pastExpiresAt })

      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyExpired(currentSession.id))

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
    })

    it('should return error when session is already expired', async () => {
      await userSessionDatabaseHelper.update(currentSession.id, { revoked_at: now })

      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyRevoked(currentSession.id))

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
    })

    it('should return error when session is not found', async () => {
      await userDatabaseHelper.update(userId, { status: UserStatus.deactivated().value })

      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const result = await useCase.execute(request)

      const activeSessionsAfter = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.userNotFound(userId))

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
    })
  })
})
