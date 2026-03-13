import { LogoutUser } from '~/src/modules/Auth/Application/LogoutUser/LogoutUser'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { QueryRunner } from 'typeorm'
import { mock, mockReset } from 'jest-mock-extended'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { LogoutUserApplicationError } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationError'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { LogoutUserApplicationRequestDto } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationRequestDto'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

describe('LogoutUser', () => {
  const now = new Date('2026-03-09T11:45:00.000Z')
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const pastDate = new Date(now.getTime() - 3600 * 1000)

  const validUserId = IdentifierMother.valid()
  const validSessionId1 = IdentifierMother.valid()
  const validSessionId2 = IdentifierMother.valid()

  let userDatabaseHelper: UserDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper

  let existingRawUser: UserRawModelWithRelations
  let activeRawSession: UserSessionRawWithRelationships
  let secondaryRawSession: UserSessionRawWithRelationships

  let baseRequest: LogoutUserApplicationRequestDto

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const loggerService = new LoggerServiceMock()

  beforeEach(() => {
    mockReset(mockedResolver)
    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

    existingRawUser = makeRawUser({
      id: validUserId.value,
    })

    activeRawSession = makeRawSession({
      id: validSessionId1.value,
      user_id: validUserId.value,
      revoked_at: null,
      expires_at: futureDate,
      updated_at: pastDate,
    })

    secondaryRawSession = makeRawSession({
      id: validSessionId2.value,
      user_id: validUserId.value,
      revoked_at: null,
      expires_at: futureDate,
      updated_at: pastDate,
    })

    baseRequest = {
      userId: validUserId.value,
      sessionId: validSessionId1.value,
    }
  })

  const buildUseCase = () => {
    return new LogoutUser(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserSessionRepository(mockedResolver),
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
    )
  }

  const runTestWithCount = async (expectedCounts: { sessions: { before: number; after: number } }) => {
    const useCase = buildUseCase()

    const sessionsBefore = await userSessionDatabaseHelper.count()

    const result = await useCase.execute(baseRequest)

    const sessionsAfter = await userSessionDatabaseHelper.count()

    expect(sessionsBefore).toEqual(expectedCounts.sessions.before)
    expect(sessionsAfter).toEqual(expectedCounts.sessions.after)

    return result
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save(existingRawUser)
    })

    it('should revoke target session correctly', async () => {
      await userSessionDatabaseHelper.save(activeRawSession)
      await userSessionDatabaseHelper.save(secondaryRawSession)

      const result = await runTestWithCount({
        sessions: { before: 2, after: 2 },
      })

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()

      const targetSession = await userSessionDatabaseHelper.findById(validSessionId1.value)
      expect(targetSession).not.toBeNull()
      expect(targetSession!.revoked_at).toEqual(now)
      expect(targetSession!.updated_at).toEqual(now)

      const secondarySession = await userSessionDatabaseHelper.findById(validSessionId2.value)
      expect(secondarySession).not.toBeNull()
      expect(secondarySession!.revoked_at).toBeNull()
      expect(secondarySession!.updated_at).toEqual(pastDate)
    })
  })

  describe('when there are errors', () => {
    it('should return error when user does not exist', async () => {
      const result = await runTestWithCount({
        sessions: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LogoutUserApplicationError.userNotFound(validUserId.value))
    })

    it('should return error when session does not exist', async () => {
      await userDatabaseHelper.save(existingRawUser)

      const result = await runTestWithCount({
        sessions: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LogoutUserApplicationError.sessionNotFound(validSessionId1.value))
    })

    it('should return error when session does not belong to user', async () => {
      const anotherUserId = IdentifierMother.valid()
      const anotherUser = makeRawUser({ id: anotherUserId.value })

      const hijackedSession = makeRawSession({
        ...activeRawSession,
        user_id: anotherUserId.value,
      })

      await userDatabaseHelper.save(existingRawUser)
      await userDatabaseHelper.save(anotherUser)
      await userSessionDatabaseHelper.save(hijackedSession)

      const result = await runTestWithCount({
        sessions: { before: 1, after: 1 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        LogoutUserApplicationError.sessionDoesNotBelongToUser(validSessionId1.value, validUserId.value),
      )

      const sessionAfter = await userSessionDatabaseHelper.findById(validSessionId1.value)
      expect(sessionAfter!.revoked_at).toBeNull()
      expect(sessionAfter!.updated_at).toEqual(pastDate)
    })

    it('should return error when session is already revoked', async () => {
      await userDatabaseHelper.save(existingRawUser)

      const alreadyRevokedSession = makeRawSession({
        ...activeRawSession,
        revoked_at: pastDate,
      })

      await userSessionDatabaseHelper.save(alreadyRevokedSession)

      const result = await runTestWithCount({
        sessions: { before: 1, after: 1 },
      })

      const expectedRevocationError = UserSessionDomainException.sessionAlreadyRevoked(validSessionId1.value)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(LogoutUserApplicationError.cannotRevokeSession(expectedRevocationError.message))

      const sessionAfter = await userSessionDatabaseHelper.findById(validSessionId1.value)
      expect(sessionAfter!.revoked_at).toEqual(pastDate)
      expect(sessionAfter!.updated_at).toEqual(pastDate)
    })
  })
})
