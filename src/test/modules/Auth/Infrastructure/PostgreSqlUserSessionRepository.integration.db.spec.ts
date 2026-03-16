import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserSessionDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserSessionDatabaseHelper'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'

describe('PostgreSqlUserSessionRepository', () => {
  const now = new Date('2025-10-20T10:40:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const expiredDate = new Date(futureExpiresAt.getTime() - 3600)

  const userId = IdentifierMother.valid()
  const userEmail = EmailAddressMother.valid()
  const sessionTokenHash = UserSessionTokenHashMother.valid()
  const userAgent = UserAgentMother.valid()

  let baseRawUserSession: UserSessionRawWithRelationships
  let rawUser: UserRawModelWithRelations
  let userSessionTestBuilder: UserSessionTestBuilder

  beforeEach(() => {
    baseRawUserSession = makeRawSession({
      user_id: userId.value,
      token_hash: sessionTokenHash.value,
      expires_at: futureExpiresAt,
      revoked_at: null,
      created_at: now,
      updated_at: now,
      user_agent: userAgent.value,
      device_city: null,
      device_country_code: null,
      ip_hash: null,
    })

    rawUser = makeRawUser({
      id: userId.value,
      email: userEmail.value,
    })

    userSessionTestBuilder = new UserSessionTestBuilder()
      .withUserAgent(userAgent)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .withIpHash(null)
      .withRevokedAt(null)
      .withExpiresAt(futureExpiresAt)
      .withDeviceLocation(null)
      .withUserId(userId)
  })

  const checkSession = (userSession: UserSession, rawUserSession: UserSessionRawWithRelationships) => {
    expect(userSession.userId.value).toBe(rawUserSession.user_id)
    expect(userSession.createdAt).toEqual(rawUserSession.created_at)
    expect(userSession.updatedAt).toEqual(rawUserSession.updated_at)
    expect(userSession.expiresAt).toEqual(rawUserSession.expires_at)

    if (userSession.revokedAt) {
      expect(userSession.revokedAt).toEqual(rawUserSession.revoked_at)
    } else {
      expect(userSession.revokedAt).toBeNull()
      expect(rawUserSession.revoked_at).toBeNull()
    }
    expect(userSession.ipHash).toBeNull()
    expect(rawUserSession.ip_hash).toBeNull()

    if (userSession.deviceLocation) {
      expect(userSession.deviceLocation?.countryCode).toBe(rawUserSession.device_country_code)
      expect(userSession.deviceLocation?.city).toBe(rawUserSession.device_city)
    } else {
      expect(userSession.deviceLocation).toBeNull()
      expect(rawUserSession.device_city).toBeNull()
      expect(rawUserSession.device_country_code).toBeNull()
    }

    expect(userSession.userAgent.value).toBe(rawUserSession.user_agent)
    expect(userSession.tokenHash.value).toBe(rawUserSession.token_hash)
  }

  describe('findUserActiveSessions', () => {
    let runner: QueryRunner
    let context: TypeOrmTxContext
    let repository: PostgreSqlUserSessionRepository

    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper

    const mockedResolver = mock<TypeOrmManagerResolver>()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    const olderDate = new Date(now.getTime() - 1000 * 3000)
    const newerDate = new Date(now.getTime() - 1000 * 2000)

    const rawActiveSession1 = makeRawSession({
      user_id: userId.value,
      revoked_at: null,
      expires_at: futureExpiresAt,
      created_at: olderDate,
    })

    const rawActiveSession2 = makeRawSession({
      user_id: userId.value,
      revoked_at: null,
      expires_at: futureExpiresAt,
      created_at: newerDate,
    })

    const rawExpiredSession = makeRawSession({
      user_id: userId.value,
      revoked_at: null,
      expires_at: expiredDate,
    })

    const rawRevokedSession = makeRawSession({
      user_id: userId.value,
      revoked_at: now,
      expires_at: futureExpiresAt,
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

      mockedResolver.resolve.mockReturnValueOnce(runner.manager)

      await userDatabaseHelper.save(rawUser)

      repository = new PostgreSqlUserSessionRepository(mockedResolver)
      context = new TypeOrmTxContext(runner.manager)
    })

    it('should return an empty array when user does not have any active session', async () => {
      const result = await repository.findUserActiveSessions(userId, now, context)

      expect(result).toEqual([])
    })

    it('should return only active sessions (not revoked and not expired)', async () => {
      await userSessionDatabaseHelper.save([rawActiveSession1, rawExpiredSession, rawRevokedSession])

      const result = await repository.findUserActiveSessions(userId, now, context)

      expect(result).toHaveLength(1)
      checkSession(result[0], rawActiveSession1)
    })

    it('should not return active sessions for a different user', async () => {
      const anotherUserId = IdentifierMother.valid()
      const otherUserRaw = makeRawUser({ id: anotherUserId.value })
      await runner.manager.getRepository(UserEntity).save(otherUserRaw)

      const anotherUserActiveSession = makeRawSession({
        user_id: anotherUserId.value,
        revoked_at: null,
        expires_at: futureExpiresAt,
      })

      await userSessionDatabaseHelper.save(anotherUserActiveSession)

      const result = await repository.findUserActiveSessions(userId, now, context)

      expect(result).toEqual([])
    })

    it('should return multiple active sessions correctly sorted', async () => {
      await userSessionDatabaseHelper.save([rawActiveSession1, rawExpiredSession, rawActiveSession2, rawRevokedSession])

      const result = await repository.findUserActiveSessions(userId, now, context)

      expect(result).toHaveLength(2)

      expect(result[0].id.value).toBe(rawActiveSession2.id)
      expect(result[1].id.value).toBe(rawActiveSession1.id)
    })
  })

  describe('save', () => {
    let runner: QueryRunner
    let context: TypeOrmTxContext
    let repository: PostgreSqlUserSessionRepository

    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper

    const mockedResolver = mock<TypeOrmManagerResolver>()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      mockedResolver.resolve.mockReturnValueOnce(runner.manager)

      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
      userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)

      await userDatabaseHelper.save(rawUser)

      repository = new PostgreSqlUserSessionRepository(mockedResolver)
      context = new TypeOrmTxContext(runner.manager)
    })

    const countSessions = async () => {
      return await userSessionDatabaseHelper.count()
    }

    const getSessions = async () => {
      return await userSessionDatabaseHelper.findAll()
    }

    it('should insert new user sessions correctly', async () => {
      const userSession1 = userSessionTestBuilder
        .withId(IdentifierMother.valid())
        .withTokenHash(UserSessionTokenHashMother.random())
        .build()
      const userSession2 = userSessionTestBuilder
        .withId(IdentifierMother.valid())
        .withTokenHash(UserSessionTokenHashMother.random())
        .build()

      const sessionsNumberBefore = await countSessions()
      const sessionsBefore = await getSessions()

      await repository.save([userSession1, userSession2], context)

      const sessionsAfter = await getSessions()
      const sessionsNumberAfter = await countSessions()

      expect(sessionsNumberBefore).toBe(0)
      expect(sessionsNumberAfter).toBe(2)
      expect(sessionsBefore).toEqual([])
      expect(sessionsAfter.length).toBe(2)

      const savedSession1 = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === userSession1.id.value)
      const savedSession2 = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === userSession2.id.value)

      expect(savedSession1).not.toBeNull()
      expect(savedSession2).not.toBeNull()
      checkSession(userSession1, savedSession1!)
      checkSession(userSession2, savedSession2!)
    })

    it('should save new session and update the existing one correctly', async () => {
      const userSessionHash = UserSessionTokenHashMother.valid()
      const existingSessionId = IdentifierMother.valid()
      const revokedAt = new Date(now.getTime() - 3600)

      const rawSession = makeRawSession({
        id: existingSessionId.value,
        user_id: userId.value,
        revoked_at: null,
        ip_hash: null,
        expires_at: futureExpiresAt,
        created_at: now,
        updated_at: now,
        device_city: null,
        device_country_code: null,
        token_hash: userSessionHash.value,
      })

      await userSessionDatabaseHelper.save(rawSession)

      const newSession = userSessionTestBuilder
        .withId(IdentifierMother.valid())
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

      const savedSession = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === newSession.id.value)
      const existingSession = sessionsAfter.find((userSessionRaw) => userSessionRaw.id === updatedSession.id.value)

      expect(savedSession).not.toBeNull()
      expect(existingSession).not.toBeNull()
      checkSession(newSession, savedSession!)
      checkSession(updatedSession, existingSession!)
    })
  })

  describe('findByHash', () => {
    let runner: QueryRunner
    let context: TypeOrmTxContext
    let repository: PostgreSqlUserSessionRepository

    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper

    const mockedResolver = mock<TypeOrmManagerResolver>()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      mockedResolver.resolve.mockReturnValueOnce(runner.manager)

      userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)
      userDatabaseHelper = new UserDatabaseHelper(runner.manager)

      await userDatabaseHelper.save(rawUser)

      repository = new PostgreSqlUserSessionRepository(mockedResolver)
      context = new TypeOrmTxContext(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userSessionDatabaseHelper.save(baseRawUserSession)

      const result = await repository.findByHash(sessionTokenHash.value, context)

      expect(result).not.toBeNull()
      checkSession(result!, baseRawUserSession)
    })

    it('should return null when user does not exist', async () => {
      const result = await repository.findByHash(sessionTokenHash.value, context)

      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    let runner: QueryRunner
    let context: TypeOrmTxContext
    let repository: PostgreSqlUserSessionRepository

    let userDatabaseHelper: UserDatabaseHelper
    let userSessionDatabaseHelper: UserSessionDatabaseHelper

    const mockedResolver = mock<TypeOrmManagerResolver>()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(async () => {
      mockReset(mockedResolver)

      mockedResolver.resolve.mockReturnValueOnce(runner.manager)

      userSessionDatabaseHelper = new UserSessionDatabaseHelper(runner.manager)
      userDatabaseHelper = new UserDatabaseHelper(runner.manager)

      await userDatabaseHelper.save(rawUser)

      repository = new PostgreSqlUserSessionRepository(mockedResolver)
      context = new TypeOrmTxContext(runner.manager)
    })

    it('should find session and translate to domain correctly', async () => {
      const sessionId = IdentifierMother.valid()
      const rawUserSession = makeRawSession({ ...baseRawUserSession, id: sessionId.value })

      await userSessionDatabaseHelper.save(rawUserSession)

      const result = await repository.findById(sessionId, context)

      expect(result).not.toBeNull()
      checkSession(result!, baseRawUserSession)
    })

    it('should return null when session does not exist', async () => {
      const sessionId = IdentifierMother.valid()

      const result = await repository.findById(sessionId, context)

      expect(result).toBeNull()
    })
  })
})
