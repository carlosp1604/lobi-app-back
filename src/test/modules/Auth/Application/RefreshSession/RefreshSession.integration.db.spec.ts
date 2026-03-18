import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
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
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { RefreshSessionApplicationResponseDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationResponseDto'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'

describe('RefreshSession', () => {
  const now = new Date('2025-10-23T11:00:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const pastExpiresAt = new Date(now.getTime() - 3600)

  const userId = IdentifierMother.valid().value
  const currentSessionId = IdentifierMother.valid().value
  const userAgent = UserAgentMother.valid()
  const userDeviceLocation = DeviceLocationMother.valid()
  const userIpHash = UserIpHashMother.random()

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

  let baseRequest: RefreshSessionApplicationRequestDto
  let currentSession: UserSessionRawWithRelationships
  let rawUser: UserRawModelWithRelations
  let refreshToken: string
  let hashedToken: string

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockReset(mockedConfigService)

    mockedConfigService.get.mockImplementation(createConfigServiceMockImplementation({ REFRESH_TTL_MS, ACCESS_TTL_MS }))
    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

    refreshToken = await jwtGenerator.generateSessionToken()
    hashedToken = await hasherService.hash(refreshToken)

    rawUser = makeRawUser({
      id: userId,
      status: UserStatus.active().value,
      deleted_at: null,
    })

    currentSession = makeRawSession({
      id: currentSessionId,
      user_id: userId,
      token_hash: hashedToken,
      expires_at: futureExpiresAt,
      revoked_at: null,
      created_at: now,
    })

    baseRequest = {
      token: refreshToken,
      clientMetadata: new ClientMetadataResponseTestBuilder()
        .withUserAgent(userAgent)
        .withUserIpHash(userIpHash)
        .withDeviceLocation(userDeviceLocation)
        .build(),
    }
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
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      new LoggerServiceMock(),
    )
  }

  const runTestWithCount = async (
    requestDto: RefreshSessionApplicationRequestDto,
    expectedCounts: { sessions: { before: number; after: number } },
  ) => {
    const useCase = buildUseCase()

    const totalSessionsBeforeRefresh = await userSessionDatabaseHelper.count()

    const result = await useCase.execute(requestDto)

    const totalSessionsAfterRefresh = await userSessionDatabaseHelper.count()

    expect(totalSessionsBeforeRefresh).toEqual(expectedCounts.sessions.before)
    expect(totalSessionsAfterRefresh).toEqual(expectedCounts.sessions.after)

    return { result }
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save(currentSession)
    })

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

    const assertSavedAndRevokedSession = async (
      result: Result<RefreshSessionApplicationResponseDto, RefreshSessionApplicationError>,
      expectedUserAgent: UserAgent,
      expectedIpHash: UserIpHash | null,
      expectedDeviceLocation: DeviceLocation | null,
    ) => {
      expect(result.success).toBe(true)

      const sessionId = result['value'].sessionId as string
      const expectedSessionHash = await hasherService.hash(result['value'].refreshToken as string)

      const updatedCurrentSession = await userSessionDatabaseHelper.findById(currentSessionId)

      expect(updatedCurrentSession).not.toBeNull()
      expect(updatedCurrentSession!.revoked_at).not.toBeNull()
      expect(updatedCurrentSession!.revoked_at).toEqual(now)
      expect(updatedCurrentSession!.updated_at).toEqual(now)

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      const savedSession = userActiveSessions.find((activeSession) => activeSession.id === sessionId)
      expect(savedSession).toBeDefined()
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
    }

    it('should revoke current session and create a new user session correctly (no revoke additional sessions)', async () => {
      const { result } = await runTestWithCount(baseRequest, {
        sessions: { before: 1, after: 2 },
      })

      assertResult(result)
      await assertSavedAndRevokedSession(result, userAgent, userIpHash, userDeviceLocation)
    })

    it('should revoke current session and create a new user session correctly (revoke sessions by policy)', async () => {
      const middleCreatedAt = new Date(now.getTime() - 2000)
      const newestCreatedAt = new Date(now.getTime() - 1000)
      const oldestCreatedAt = new Date(now.getTime() - 3000)

      const session2 = makeRawSession({ user_id: userId, created_at: middleCreatedAt, expires_at: futureExpiresAt })
      const session3 = makeRawSession({ user_id: userId, created_at: newestCreatedAt, expires_at: futureExpiresAt })
      const oldestSession = makeRawSession({ user_id: userId, created_at: oldestCreatedAt, expires_at: futureExpiresAt })

      await userSessionDatabaseHelper.save([oldestSession, session2, session3])

      const { result } = await runTestWithCount(baseRequest, {
        sessions: { before: 4, after: 5 },
      })

      assertResult(result)

      await assertSavedAndRevokedSession(result, userAgent, userIpHash, userDeviceLocation)

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(userActiveSessions).toHaveLength(maxSessions)

      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === oldestSession.id)).toBeUndefined()
      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === session2.id)).toBeDefined()
      expect(userActiveSessions.find((userActiveSession) => userActiveSession.id === session3.id)).toBeDefined()

      const updatedOldestSession = await userSessionDatabaseHelper.findById(oldestSession.id)
      expect(updatedOldestSession).not.toBeNull()
      expect(updatedOldestSession?.revoked_at).toEqual(now)
      expect(updatedOldestSession?.updated_at).toEqual(now)
    })
  })

  describe('when there are errors', () => {
    const assertCurrentActiveSession = async () => {
      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)

      expect(userActiveSessions).toHaveLength(1)
      expect(userActiveSessions[0].id).toEqual(currentSessionId)
    }

    it('should return error when the session to refresh is not found', async () => {
      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save(currentSession)

      const anotherRefreshToken = await jwtGenerator.generateSessionToken()

      const { result } = await runTestWithCount({ ...baseRequest, token: anotherRefreshToken }, { sessions: { before: 1, after: 1 } })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionNotFound())
      await assertCurrentActiveSession()
    })

    it('should return error when the session to refresh is already expired', async () => {
      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save({ ...currentSession, expires_at: pastExpiresAt })

      const { result } = await runTestWithCount(baseRequest, { sessions: { before: 1, after: 1 } })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyExpired())

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      expect(userActiveSessions).toHaveLength(0)
    })

    it('should return error when the session to refresh is already revoked', async () => {
      await userDatabaseHelper.save(rawUser)
      await userSessionDatabaseHelper.save({ ...currentSession, revoked_at: now })

      const { result } = await runTestWithCount(baseRequest, { sessions: { before: 1, after: 1 } })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.sessionAlreadyRevoked())

      const userActiveSessions = await userSessionDatabaseHelper.findActiveSessions(userId, now)
      expect(userActiveSessions).toHaveLength(0)
    })

    it('should return error when user is disabled', async () => {
      await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })
      await userSessionDatabaseHelper.save(currentSession)

      const { result } = await runTestWithCount(baseRequest, { sessions: { before: 1, after: 1 } })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(RefreshSessionApplicationError.userDisabled())

      await assertCurrentActiveSession()
    })
  })
})
