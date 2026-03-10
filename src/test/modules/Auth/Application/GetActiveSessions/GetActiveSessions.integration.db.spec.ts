import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { QueryRunner } from 'typeorm'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { mock, mockReset } from 'jest-mock-extended'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { GetActiveSessions } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessions'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { GetActiveSessionsApplicationRequestDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationRequestDto'

describe('GetActiveSessions', () => {
  const now = new Date('2026-03-10T10:40:00.000Z')
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const pastDate = new Date(now.getTime() - 3600 * 1000)

  const olderDate = new Date('2026-03-10T08:00:00.000Z')
  const newerDate = new Date('2026-03-10T09:00:00.000Z')

  const validUserId = IdentifierMother.valid()
  const anotherUserId = IdentifierMother.valid()
  const currentSessionId = IdentifierMother.valid()
  const otherSessionId = IdentifierMother.valid()

  let userDatabaseHelper: UserDatabaseHelper
  let userSessionDatabaseHelper: UserSessionDatabaseHelper

  let existingRawUser: UserRawModelWithRelations
  let anotherRawUser: UserRawModelWithRelations

  let baseRequest: GetActiveSessionsApplicationRequestDto

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(() => {
    mockReset(mockedResolver)
    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

    existingRawUser = makeRawUser({ id: validUserId.value })
    anotherRawUser = makeRawUser({ id: anotherUserId.value })

    baseRequest = {
      userId: validUserId.value,
      currentSessionId: currentSessionId.value,
    }
  })

  const buildUserRawSession = (id: Identifier, userId: Identifier, createdAt: Date, type: 'active' | 'revoked' | 'expired') => {
    return makeRawSession({
      id: id.value,
      user_id: userId.value,
      revoked_at: type === 'revoked' ? pastDate : null,
      expires_at: type === 'expired' ? pastDate : futureDate,
      created_at: createdAt,
    })
  }

  const buildUseCase = () => {
    return new GetActiveSessions(new PostgreSqlUserSessionRepository(mockedResolver), new ClockServiceMock(now))
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save([existingRawUser, anotherRawUser])
    })

    it('should return active sessions ordered with correct isCurrent flag', async () => {
      const activeSession1 = buildUserRawSession(currentSessionId, validUserId, olderDate, 'active')
      const activeSession2 = buildUserRawSession(otherSessionId, validUserId, newerDate, 'active')
      const sessionAnotherUser = buildUserRawSession(IdentifierMother.valid(), anotherUserId, now, 'active')

      await userSessionDatabaseHelper.save([activeSession1, activeSession2, sessionAnotherUser])

      const useCase = buildUseCase()
      const result = await useCase.execute(baseRequest)

      expect(result.success).toBe(true)

      expect(result['value'].sessions).toHaveLength(2)

      expect(result['value'].sessions[0].id).toBe(activeSession2.id)
      expect(result['value'].sessions[0].isCurrent).toBe(false)

      expect(result['value'].sessions[1].id).toBe(activeSession1.id)
      expect(result['value'].sessions[1].isCurrent).toBe(true)
    })

    it('should return empty array when user has no active sessions', async () => {
      const expiredSession = buildUserRawSession(currentSessionId, validUserId, olderDate, 'expired')
      const revokedSession = buildUserRawSession(otherSessionId, validUserId, newerDate, 'revoked')

      await userSessionDatabaseHelper.save([expiredSession, revokedSession])

      const useCase = buildUseCase()
      const result = await useCase.execute(baseRequest)

      expect(result.success).toBe(true)
      expect(result['value'].sessions).toEqual([])
    })

    it('should return empty array when user does not exist or has no sessions at all', async () => {
      const useCase = buildUseCase()

      const result = await useCase.execute(baseRequest)

      expect(result.success).toBe(true)
      expect(result['value'].sessions).toEqual([])
    })
  })
})
