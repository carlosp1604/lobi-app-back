import { CloseUserSession } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSession'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { QueryRunner } from 'typeorm'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { mock, mockReset } from 'jest-mock-extended'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { CloseUserSessionApplicationError } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationError'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { CloseUserSessionApplicationRequestDto } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationRequestDto'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'

describe('CloseUserSession', () => {
  const now = new Date('2026-03-12T15:50:00.000Z')
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const pastDate = new Date(now.getTime() - 3600 * 1000)

  const validUserId = IdentifierMother.valid()
  const validTargetSessionId = IdentifierMother.valid()
  const validCurrentSessionId = IdentifierMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()

  let userDatabaseHelper: UserDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

  let existingRawUser: UserRawModelWithRelations
  let targetRawSession: UserSessionRawWithRelationships
  let currentRawSession: UserSessionRawWithRelationships

  let baseRequest: CloseUserSessionApplicationRequestDto

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const loggerService = new LoggerServiceMock()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedRequestOriginService)

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    mockedRequestOriginService.process.mockResolvedValue({
      userAgent: validUserAgent,
      ipHash: validIpHash.value,
      normalizedIp: '127.0.0.1',
      deviceLocation: DeviceLocationMother.valid(),
    })

    existingRawUser = makeRawUser({
      id: validUserId.value,
    })

    targetRawSession = makeRawSession({
      id: validTargetSessionId.value,
      user_id: validUserId.value,
      revoked_at: null,
      expires_at: futureDate,
      updated_at: pastDate,
    })

    currentRawSession = makeRawSession({
      id: validCurrentSessionId.value,
      user_id: validUserId.value,
      revoked_at: null,
      expires_at: futureDate,
      updated_at: pastDate,
    })

    baseRequest = {
      userId: validUserId.value,
      sessionId: validTargetSessionId.value,
      currentSessionId: validCurrentSessionId.value,
      ip: '127.0.0.1',
      userAgent: validUserAgent.raw,
    }
  })

  const buildUseCase = () => {
    return new CloseUserSession(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserSessionRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      mockedRequestOriginService,
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      new AuthDomainEventFactory(new NodeIdGeneratorService()),
    )
  }

  const runTestWithCount = async (expectedCounts: {
    sessions: { before: number; after: number }
    events: { before: number; after: number }
  }) => {
    const useCase = buildUseCase()

    const sessionsBefore = await userSessionDatabaseHelper.count()
    const eventsBefore = await domainEventDatabaseHelper.count()

    const result = await useCase.execute(baseRequest)

    const sessionsAfter = await userSessionDatabaseHelper.count()
    const eventsAfter = await domainEventDatabaseHelper.count()

    expect(sessionsBefore).toEqual(expectedCounts.sessions.before)
    expect(sessionsAfter).toEqual(expectedCounts.sessions.after)
    expect(eventsBefore).toEqual(expectedCounts.events.before)
    expect(eventsAfter).toEqual(expectedCounts.events.after)

    return result
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save(existingRawUser)
    })

    it('should revoke target session and save domain event correctly', async () => {
      await userSessionDatabaseHelper.save(targetRawSession)
      await userSessionDatabaseHelper.save(currentRawSession)

      const result = await runTestWithCount({
        sessions: { before: 2, after: 2 },
        events: { before: 0, after: 1 },
      })

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()

      const targetSession = await userSessionDatabaseHelper.findById(validTargetSessionId.value)
      expect(targetSession).not.toBeNull()
      expect(targetSession!.revoked_at).toEqual(now)
      expect(targetSession!.updated_at).toEqual(now)

      const currentSession = await userSessionDatabaseHelper.findById(validCurrentSessionId.value)
      expect(currentSession).not.toBeNull()
      expect(currentSession!.revoked_at).toBeNull()
      expect(currentSession!.updated_at).toEqual(pastDate)

      const savedEvent = await domainEventDatabaseHelper.findByAggregateTypeAndId(
        validTargetSessionId.value,
        DomainEventAggregateType.userSession().value,
      )
      expect(savedEvent).toHaveLength(1)
      expect(savedEvent[0].name).toBe(DomainEventName.closedSession().value)
      expect(savedEvent[0].occurred_at).toEqual(now)
    })
  })

  describe('when there are errors', () => {
    it('should return error when user does not exist', async () => {
      const result = await runTestWithCount({
        sessions: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.userNotFound(validUserId.value))
    })

    it('should return error when session does not exist', async () => {
      await userDatabaseHelper.save(existingRawUser)

      const result = await runTestWithCount({
        sessions: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.sessionNotFound(validTargetSessionId.value))
    })

    it('should return error when session does not belong to user', async () => {
      const anotherUserId = IdentifierMother.valid()
      const anotherUser = makeRawUser({ id: anotherUserId.value })

      const hijackedSession = makeRawSession({
        ...targetRawSession,
        user_id: anotherUserId.value,
      })

      await userDatabaseHelper.save(existingRawUser)
      await userDatabaseHelper.save(anotherUser)
      await userSessionDatabaseHelper.save(hijackedSession)

      const result = await runTestWithCount({
        sessions: { before: 1, after: 1 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        CloseUserSessionApplicationError.sessionDoesNotBelongToUser(validTargetSessionId.value, validUserId.value),
      )

      const sessionAfter = await userSessionDatabaseHelper.findById(validTargetSessionId.value)

      expect(sessionAfter!.revoked_at).toBeNull()
      expect(sessionAfter!.updated_at).toEqual(pastDate)
    })

    it('should return error when session is already revoked', async () => {
      await userDatabaseHelper.save(existingRawUser)

      const alreadyRevokedSession = makeRawSession({
        ...targetRawSession,
        revoked_at: pastDate,
      })

      await userSessionDatabaseHelper.save(alreadyRevokedSession)

      const result = await runTestWithCount({
        sessions: { before: 1, after: 1 },
        events: { before: 0, after: 0 },
      })

      const expectedRevocationError = UserSessionDomainException.sessionAlreadyRevoked(validTargetSessionId.value)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.cannotRevokeSession(expectedRevocationError.message))

      const sessionAfter = await userSessionDatabaseHelper.findById(validTargetSessionId.value)

      expect(sessionAfter!.revoked_at).toEqual(pastDate)
      expect(sessionAfter!.updated_at).toEqual(pastDate)
    })
  })
})
