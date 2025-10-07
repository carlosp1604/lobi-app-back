import { QueryRunner, Repository } from 'typeorm'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import {
  UserSessionEntity,
  UserSessionRawModel,
  UserSessionRawWithRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/User.entity'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'

describe('PostgreSqlUserSessionRepository', () => {
  const makeRawSession = (overrides: Partial<UserSessionRawModel> = {}): UserSessionRawModel => {
    return {
      id: overrides.id ?? UserSessionIdMother.valid().toString(),
      user_id: overrides.user_id ?? UserIdMother.valid().toString(),
      token_hash: overrides.token_hash ?? UserSessionHashMother.random().toString(),
      revoked_at: overrides.revoked_at ?? null,
      expires_at: overrides.expires_at ?? new Date(Date.now() + 60 * 60 * 1000),
      ip_hash: overrides.ip_hash ?? null,
      user_agent: overrides.user_agent ?? UserAgentMother.valid().toString(),
      device_country: overrides.device_country ?? null,
      device_city: overrides.device_city ?? null,
      device_timezone: overrides.device_timezone ?? null,
      created_at: overrides.created_at ?? new Date(),
      updated_at: overrides.updated_at ?? new Date(),
    }
  }

  const userId = UserIdMother.valid()
  const anotherUserId = UserIdMother.valid()
  const anotherUserEmail = UserEmailMother.random()
  const anotherUserUsername = UserUsernameMother.random()

  const rawUser: UserRawModelWithRelations = {
    id: userId.toString(),
    email: UserEmailMother.valid().toString(),
    username: UserUsernameMother.valid().toString(),
    name: UserNameMother.valid().toString(),
    status: UserStatus.active().toString(),
    role: UserRole.sportsman().toString(),
    user_upload_id: UserUploadIdMother.valid().toString(),
    email_verified_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  }

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(() => {
    mockReset(mockedResolver)

    mockedResolver.resolve.mockReturnValueOnce(runner.manager)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('revokeOldestAndSave', () => {
    const base = new Date()

    const userSessionToSaveId = UserIdMother.valid()
    const userSessionToSave = new UserSessionTestBuilder()
      .withId(userSessionToSaveId)
      .withUserId(userId)
      .withExpiresAt(new Date(base.getTime() + 60 * 60 * 1000))
      .build()

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(rawUser)
      await userRepository.save({
        ...rawUser,
        id: anotherUserId.toString(),
        username: anotherUserUsername.toString(),
        email: anotherUserEmail.toString(),
      })
    })

    const assertActives = (rows: Array<UserSessionRawWithRelationships>, expectedSessions: Array<string>) => {
      const active = rows.filter((userSessionRaw) => !userSessionRaw.revoked_at && userSessionRaw.expires_at.getTime() > base.getTime())
      expect(active.map((userSessionRaw) => userSessionRaw.id).sort()).toEqual(expectedSessions.sort())
    }

    const getUserSessions = async (userSessionRepository: Repository<UserSessionRawWithRelationships>, userId: string) => {
      return userSessionRepository.find({ where: { user_id: userId }, order: { created_at: 'ASC' } })
    }

    const assertAnotherUserSessionIstNotRevoked = async (
      userSessionRepository: Repository<UserSessionRawWithRelationships>,
      sessionId: string,
    ) => {
      const other: UserSessionRawModel | null = await userSessionRepository.findOneBy({ id: sessionId })
      expect(other!.revoked_at).toBeNull()
    }

    it('should not revoke any session and inserts the new one', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)
      const context = new TypeOrmTxContext(runner.manager)
      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)

      const session1Id = UserIdMother.valid().toString()
      const session2Id = UserIdMother.valid().toString()

      const s1 = makeRawSession({
        user_id: userId.toString(),
        created_at: new Date(base),
        id: session1Id,
      })

      const s2 = makeRawSession({ user_id: anotherUserId.toString(), id: session2Id })

      await userSessionRepository.save([s1, s2])

      await repository.revokeOldestAndSave(userSessionToSave, 2, context)

      const rows = await getUserSessions(userSessionRepository, userId.toString())

      const byId = new Map(rows.map((r) => [r.id, r]))

      expect(byId.get(userSessionToSaveId.toString())).not.toBeNull()
      expect(byId.get(session1Id)!.revoked_at).toBeNull()

      await assertAnotherUserSessionIstNotRevoked(userSessionRepository, session2Id)
      assertActives(rows, [session1Id, userSessionToSaveId.toString()])
    })

    it('should throw error if session already exists', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)
      const context = new TypeOrmTxContext(runner.manager)
      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)

      const rawSession = makeRawSession({
        id: userSessionToSave.id.toString(),
        user_id: userSessionToSave.userId.toString(),
      })

      await userSessionRepository.save(rawSession)

      await expect(repository.revokeOldestAndSave(userSessionToSave, 2, context)).rejects.toThrow()
    })

    it('should revoke the oldest sessions and inserts the new one', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)
      const context = new TypeOrmTxContext(runner.manager)
      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)

      const session1Id = UserIdMother.valid().toString()
      const session2Id = UserIdMother.valid().toString()
      const session3Id = UserIdMother.valid().toString()
      const session4Id = UserIdMother.valid().toString()
      const session5Id = UserIdMother.valid().toString()
      const session6Id = UserIdMother.valid().toString()
      const session7Id = UserIdMother.valid().toString()

      const s1 = makeRawSession({
        user_id: userId.toString(),
        created_at: new Date(base),
        id: session1Id,
      })
      const s2 = makeRawSession({
        user_id: userId.toString(),
        created_at: new Date(base.getTime() + 1),
        id: session2Id,
      })
      const s3 = makeRawSession({
        user_id: userId.toString(),
        created_at: new Date(base.getTime() + 2),
        id: session3Id,
      })
      const s4 = makeRawSession({
        user_id: userId.toString(),
        created_at: new Date(base.getTime() + 3),
        id: session4Id,
      })
      const s5 = makeRawSession({
        user_id: userId.toString(),
        revoked_at: new Date(base.getTime() + 4),
        id: session5Id,
      })
      const s6 = makeRawSession({
        user_id: userId.toString(),
        expires_at: new Date(base.getTime() - 3600),
        id: session6Id,
      })

      const s7 = makeRawSession({ user_id: anotherUserId.toString(), id: session7Id })

      await userSessionRepository.save([s1, s2, s3, s4, s5, s6, s7])

      await repository.revokeOldestAndSave(userSessionToSave, 2, context)

      const rows = await getUserSessions(userSessionRepository, userId.toString())

      const byId = new Map(rows.map((r) => [r.id, r]))

      expect(byId.get(userSessionToSaveId.toString())).not.toBeNull()
      expect(byId.get(session1Id)!.revoked_at).toBeTruthy()
      expect(byId.get(session2Id)!.revoked_at).toBeTruthy()
      expect(byId.get(session3Id)!.revoked_at).toBeTruthy()
      expect(byId.get(session4Id)!.revoked_at).toBeNull()

      expect(byId.get(session5Id)!.revoked_at).toBeTruthy()
      expect(byId.get(session6Id)!.expires_at.getTime()).toBeLessThan(base.getTime())

      await assertAnotherUserSessionIstNotRevoked(userSessionRepository, session7Id)
      assertActives(rows, [session4Id, userSessionToSaveId.toString()])
    })
  })

  describe('existsDevice', () => {
    const base = new Date()

    const expectedIpHash = UserSessionIpHashMother.valid()
    const expectedUserAgent = UserAgentMother.valid()
    const expectedExpiresAt = new Date(base.getTime() + 3600)

    const baseRawUserSession = makeRawSession({
      user_id: userId.toString(),
      user_agent: expectedUserAgent.toString(),
      ip_hash: expectedIpHash.toString(),
      expires_at: expectedExpiresAt,
      revoked_at: null,
    })

    let userSessionTestBuilder = new UserSessionTestBuilder()

    beforeEach(async () => {
      userSessionTestBuilder = new UserSessionTestBuilder()
        .withUserId(userId)
        .withUserAgent(expectedUserAgent)
        .withIpHash(expectedIpHash)
        .withExpiresAt(expectedExpiresAt)
        .withRevokedAt(null)

      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(rawUser)
    })

    it('should return true when user_id, ip_hash and user_agent match and session is active (not revoked and not expired)', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      await sessionsRepository.save(baseRawUserSession)

      const userSession = userSessionTestBuilder.build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(true)
    })

    it('should return false if user session is expired', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      const pastExpiresAt = new Date(base.getTime() - 3600)
      await sessionsRepository.save({ ...baseRawUserSession, expires_at: pastExpiresAt })
      const userSession = userSessionTestBuilder.build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(false)
    })

    it('should return false if user session is revoked', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      const pastRevokedAt = new Date(base.getTime() - 3600)
      await sessionsRepository.save({ ...baseRawUserSession, revoked_at: pastRevokedAt })
      const userSession = userSessionTestBuilder.build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(false)
    })

    it('should return true if ip_hash is NULL but user_agent does match', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      await sessionsRepository.save({ ...baseRawUserSession, ip_hash: null })

      const userSession = userSessionTestBuilder.withIpHash(null).build()
      const found = await repository.existsDevice(userSession)

      expect(found).toBe(true)
    })

    it('should return false if ip_hash does not match', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      const anotherIpHash = UserSessionIpHashMother.random()
      await sessionsRepository.save({ ...baseRawUserSession, ip_hash: expectedIpHash.toString() })
      const userSession = userSessionTestBuilder.withIpHash(anotherIpHash).build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(false)
    })

    it('should return false if user_agent does not match', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      const anotherUserAgent = UserAgentMother.random()
      await sessionsRepository.save({ ...baseRawUserSession, user_agent: expectedUserAgent.toString() })
      const userSession = userSessionTestBuilder.withUserAgent(anotherUserAgent).build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(false)
    })

    it('should return false when session exists but belongs to another user', async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save({
        ...rawUser,
        id: anotherUserId.toString(),
        username: anotherUserUsername.toString(),
        email: anotherUserEmail.toString(),
      })

      const anotherUserSession = { ...baseRawUserSession, user_id: anotherUserId.toString() }

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      await sessionsRepository.save(anotherUserSession)

      const userSession = userSessionTestBuilder.build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(false)
    })

    it('should return true when there are many sessions and one of them matches', async () => {
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const sessionsRepository = runner.manager.getRepository(UserSessionEntity)

      await sessionsRepository.save(baseRawUserSession)
      await sessionsRepository.save({
        ...baseRawUserSession,
        id: UserSessionIdMother.valid().toString(),
        user_agent: UserAgentMother.random().toString(),
        token_hash: UserSessionHashMother.random().toString(),
      })

      const userSession = userSessionTestBuilder.build()

      const found = await repository.existsDevice(userSession)

      expect(found).toBe(true)
    })
  })
})
