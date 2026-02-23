import { QueryRunner, Repository } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { UserSessionEntity, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'

describe('PostgreSqlUserSessionRepository', () => {
  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(() => {
    mockReset(mockedResolver)

    mockedResolver.resolve.mockReturnValueOnce(runner.manager)
  })

  const checkSession = (userSession: UserSession, rawUserSession: UserSessionRawWithRelationships) => {
    expect(userSession.userId.toString()).toBe(rawUserSession.user_id)
    expect(userSession.createdAt.getTime()).toBe(rawUserSession.created_at.getTime())
    expect(userSession.updatedAt.getTime()).toBe(rawUserSession.updated_at.getTime())
    expect(userSession.expiresAt.getTime()).toBe(rawUserSession.expires_at.getTime())

    if (userSession.revokedAt) {
      expect(userSession.revokedAt.getTime()).toBe(rawUserSession.revoked_at?.getTime())
    } else {
      expect(userSession.revokedAt).toBe(null)
      expect(rawUserSession.revoked_at).toBe(null)
    }
    expect(userSession.ipHash).toBe(null)
    expect(rawUserSession.ip_hash).toBe(null)

    if (userSession.deviceLocation) {
      expect(userSession.deviceLocation?.countryCode).toBe(rawUserSession.device_country_code)
      expect(userSession.deviceLocation?.city).toBe(rawUserSession.device_city)
    } else {
      expect(userSession.deviceLocation).toBe(null)
      expect(rawUserSession.device_city).toBe(null)
      expect(rawUserSession.device_country_code).toBe(null)
    }

    expect(userSession.userAgent.toString()).toBe(rawUserSession.user_agent)
    expect(userSession.tokenHash.toString()).toBe(rawUserSession.token_hash)
  }

  describe('findUserActiveSessions', () => {
    const now = new Date('2025-10-20T10:40:00Z')
    const expiresAt = new Date(now.getTime() + 3600)
    const expiredDate = new Date(expiresAt.getTime() - 3600)
    const userId = UserIdMother.valid()

    let repository: PostgreSqlUserSessionRepository
    let context: TypeOrmTxContext
    let userSessionRepository: Repository<UserSessionRawWithRelationships>

    const rawActiveSession1 = makeRawSession({
      user_id: userId.toString(),
      revoked_at: null,
      expires_at: expiresAt,
    })

    const rawActiveSession2 = makeRawSession({
      user_id: userId.toString(),
      revoked_at: null,
      expires_at: expiresAt,
    })

    const rawExpiredSession = makeRawSession({
      user_id: userId.toString(),
      revoked_at: null,
      expires_at: expiredDate,
    })

    const rawRevokedSession = makeRawSession({
      user_id: userId.toString(),
      revoked_at: now,
      expires_at: expiresAt,
    })

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)

      const rawUser = makeRawUser({
        id: userId.toString(),
      })

      await userRepository.save(rawUser)

      repository = new PostgreSqlUserSessionRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      context = new TypeOrmTxContext(runner.manager)
      userSessionRepository = runner.manager.getRepository(UserSessionEntity)
    })

    it('should return an empty array when user does not have any active session', async () => {
      const result = await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(result).toEqual([])
    })

    it('should return only active sessions (not revoked and not expired)', async () => {
      await userSessionRepository.save([rawActiveSession1, rawExpiredSession, rawRevokedSession])

      const result = await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(result).toHaveLength(1)
      checkSession(result[0], rawActiveSession1)
    })

    it('should not return active sessions for a different user', async () => {
      const anotherUserId = UserIdMother.valid()
      const otherUserRaw = makeRawUser({ id: anotherUserId.toString() })
      await runner.manager.getRepository(UserEntity).save(otherUserRaw)

      const anotherUserActiveSession = makeRawSession({
        user_id: anotherUserId.toString(),
        revoked_at: null,
        expires_at: expiresAt,
      })

      await userSessionRepository.save(anotherUserActiveSession)

      const result = await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(result).toEqual([])
    })

    it('should return multiple active sessions', async () => {
      await userSessionRepository.save([rawActiveSession1, rawActiveSession2, rawExpiredSession, rawRevokedSession])

      const result = await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(result).toHaveLength(2)
      expect(result.some((session) => session.id.toString() === rawActiveSession1.id)).toBe(true)
      expect(result.some((session) => session.id.toString() === rawActiveSession2.id)).toBe(true)
    })
  })

  describe('save', () => {
    const now = new Date('2025-10-17T15:26:21Z')
    const expiresAt = new Date(now.getTime() + 3600)
    const userId = UserIdMother.valid()
    const userEmail = EmailAddressMother.valid()

    let userSessionTestBuilder = new UserSessionTestBuilder()

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)

      const rawUser = makeRawUser({
        id: userId.toString(),
        email: userEmail.toString(),
      })
      await userRepository.save(rawUser)

      userSessionTestBuilder = new UserSessionTestBuilder()
        .withUserAgent(UserAgentMother.random())
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withIpHash(null)
        .withRevokedAt(null)
        .withExpiresAt(expiresAt)
        .withDeviceLocation(null)
        .withUserId(userId)
    })

    const countSessions = async () => {
      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)

      return await userSessionRepository.count()
    }

    const getSessions = async () => {
      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)
      return await userSessionRepository.find()
    }

    it('should insert new  user sessions correctly', async () => {
      const userSession1 = userSessionTestBuilder
        .withId(UserSessionIdMother.valid())
        .withTokenHash(UserSessionTokenHashMother.random())
        .build()
      const userSession2 = userSessionTestBuilder
        .withId(UserSessionIdMother.valid())
        .withTokenHash(UserSessionTokenHashMother.random())
        .build()

      const repository = new PostgreSqlUserSessionRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const context = new TypeOrmTxContext(runner.manager)

      const sessionsNumberBefore = await countSessions()
      const sessionsBefore = await getSessions()

      await repository.save([userSession1, userSession2], context)

      const sessionsAfter = await getSessions()
      const sessionsNumberAfter = await countSessions()

      expect(sessionsNumberBefore).toBe(0)
      expect(sessionsNumberAfter).toBe(2)
      expect(sessionsBefore).toEqual([])
      expect(sessionsAfter.length).toBe(2)

      const savedSession1 = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === userSession1.id.toString())
      const savedSession2 = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === userSession2.id.toString())

      expect(savedSession1).toBeTruthy()
      expect(savedSession2).toBeTruthy()
      checkSession(userSession1, savedSession1!)
      checkSession(userSession2, savedSession2!)
    })

    it('should save new session and update the existing one correctly', async () => {
      const userSessionHash = UserSessionTokenHashMother.valid()
      const existingSessionId = UserSessionIdMother.valid()
      const revokedAt = new Date(now.getTime() - 3600)

      const rawSession = makeRawSession({
        id: existingSessionId.toString(),
        user_id: userId.toString(),
        revoked_at: null,
        ip_hash: null,
        expires_at: expiresAt,
        created_at: now,
        updated_at: now,
        device_city: null,
        device_country_code: null,
        token_hash: userSessionHash.toString(),
      })

      const userSessionRepository = runner.manager.getRepository(UserSessionEntity)
      await userSessionRepository.save(rawSession)

      const newSession = userSessionTestBuilder
        .withId(UserSessionIdMother.valid())
        .withTokenHash(UserSessionTokenHashMother.random())
        .build()

      const updatedSession = userSessionTestBuilder
        .withId(existingSessionId)
        .withTokenHash(userSessionHash)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withRevokedAt(revokedAt)
        .build()

      const repository = new PostgreSqlUserSessionRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const context = new TypeOrmTxContext(runner.manager)

      const sessionsNumberBefore = await countSessions()
      const sessionsBefore = await getSessions()

      await repository.save([newSession, updatedSession], context)

      const sessionsAfter = await getSessions()
      const sessionsNumberAfter = await countSessions()

      expect(sessionsNumberBefore).toBe(1)
      expect(sessionsBefore[0]).toEqual(rawSession)
      expect(sessionsNumberAfter).toBe(2)
      expect(sessionsAfter.length).toBe(2)

      const savedSession = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === newSession.id.toString())
      const existingSession = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === updatedSession.id.toString())

      expect(savedSession).toBeTruthy()
      expect(existingSession).toBeTruthy()
      checkSession(newSession, savedSession!)
      checkSession(updatedSession, existingSession!)
    })
  })
})
