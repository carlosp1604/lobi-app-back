import { LoginUser } from '~/src/modules/Auth/Application/LoginUser/LoginUser'
import { IsNull, QueryRunner, Repository } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { BCryptPasswordHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptPasswordHasherService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { NodeHasherService } from '~/src/modules/Auth/Infrastructure/Services/NodeHasherService'
import { NoopDeviceLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/NoopDeviceLocationResolverService'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { IpAddressIpValidatorService } from '~/src/modules/Auth/Infrastructure/Services/IpAddressIpValidatorService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import {
  UserCredentialEntity,
  UserCredentialRawWitRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionEntity, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { DomainEventEntity, DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'

describe('LoginUser', () => {
  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.random()
  const expectedUserAgent = UserAgentMother.random()
  let userRepository: Repository<UserRawModelWithRelations>
  let userCredentialRepository: Repository<UserCredentialRawWitRelationships>
  let userSessionRepository: Repository<UserSessionRawWithRelationships>
  let domainEventRepository: Repository<DomainEventRawModel>
  const now = new Date()
  let rawUser: UserRawModelWithRelations

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(async () => {
    mockReset(mockedResolver)

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userRepository = runner.manager.getRepository(UserEntity)
    userCredentialRepository = runner.manager.getRepository(UserCredentialEntity)
    userSessionRepository = runner.manager.getRepository(UserSessionEntity)
    domainEventRepository = runner.manager.getRepository(DomainEventEntity)

    rawUser = makeRawUser({
      id: userId.toString(),
      email: userEmail.toString(),
      status: UserStatus.active().toString(),
    })
    await userRepository.save(rawUser)
    const userPassword = await passwordHasher.hash('expected-password')
    const rawUserCredential = makeRawUserCredential({
      user_id: userId.toString(),
      password_hash: userPassword,
      locked_until: null,
      last_login_at: null,
    })
    await userCredentialRepository.save(rawUserCredential)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const passwordHasher = new BCryptPasswordHasherService(1)
  const hasherService = new NodeHasherService('test-hash-secret')
  const refreshTtl = 600000
  const accessTtl = 6000
  const maxSessions = 4

  const buildUseCase = () => {
    return new LoginUser(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserCredentialRepository(mockedResolver),
      new PostgreSqlUserSessionRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      passwordHasher,
      new JWTokenGeneratorApplicationService('test-secret', 'test-issuer', 'test-audience'),
      hasherService,
      new NoopDeviceLocationResolverService(),
      new MaxSessionsPolicy({ maxActive: maxSessions }),
      new ClockServiceMock(now),
      new TypeOrmUnitOfWork(global.dataSource),
      new LoggerServiceMock(),
      new NodeIdGeneratorService(),
      new IpAddressIpValidatorService(),
      accessTtl,
      refreshTtl,
    )
  }

  const countUserSessions = async () => {
    return userSessionRepository.countBy({
      user_id: userId.toString(),
      revoked_at: IsNull(),
    })
  }

  describe('happy path', () => {
    const assertCommon = (
      result: Result<LoginUserApplicationResponseDto, LoginUserApplicationError>,
      newDevice: boolean,
      beforeSessions: number,
      afterSessions: number,
    ) => {
      expect(result).toEqual({
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: expect.objectContaining<Record<string, unknown>>({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          sessionId: expect.any(String),
          accessTokenExpiresAt: new Date(now.getTime() + accessTtl),
          refreshTokenExpiresAt: new Date(now.getTime() + refreshTtl),
          isNewDevice: newDevice,
        }),
      })

      expect(beforeSessions).toBe(afterSessions)
      expect(afterSessions).not.toBeGreaterThan(maxSessions)
    }

    it('should authenticate and create a new user session correctly (no revoke sessions)', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await countUserSessions()

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'expected-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const activeSessionsAfter = await countUserSessions()

      assertCommon(result, true, activeSessionsBefore + 1, activeSessionsAfter)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sessionId: string = result.value!.sessionId

      const userSession = await userSessionRepository.findOneBy({
        id: sessionId,
        user_id: userId.toString(),
      })

      const domainEvent = await domainEventRepository.findOneBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      const userCredential = await userCredentialRepository.findOneBy({
        user_id: userId.toString(),
      })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const expectedSessionHash = await hasherService.hash(result.value!.refreshToken as string)

      expect(userSession).toBeTruthy()
      expect(userSession!.id).toBe(sessionId)
      expect(userSession!.user_id).toBe(userId.toString())
      expect(userSession!.user_agent).toBe(expectedUserAgent.toString())
      expect(userSession!.ip_hash).toBeNull()
      expect(userSession!.device_country).toBeNull()
      expect(userSession!.device_city).toBeNull()
      expect(userSession!.device_timezone).toBeNull()
      expect(userSession!.token_hash).toBe(expectedSessionHash)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(userSession!.token_hash).not.toBe(result.value!.refreshToken)
      expect(userSession!.expires_at.getTime()).toBe(now.getTime() + refreshTtl)

      expect(userCredential).toBeTruthy()
      expect(userCredential!.last_login_at!.getTime()).toBe(now.getTime())
      expect(userCredential!.failed_attempts).toBe(0)
      expect(userCredential!.locked_until).toBeNull()

      expect(domainEvent).toBeTruthy()
      expect(domainEvent!.name).toBe(DomainEventName.successfulLogin().toString())
      expect(domainEvent!.aggregate_type).toBe(DomainEventAggregateType.user().toString())
      expect(domainEvent!.aggregate_id).toBe(userId.toString())

      const payload = domainEvent!.payload
      expect(payload.userId).toBe(userId.toString())
      expect(payload.sessionId).toBe(sessionId)
      expect(payload.isNewDevice).toBe(true)
      expect(payload.country).toBeNull()
      expect(payload.city).toBeNull()
      expect(payload.timezone).toBeNull()

      const meta = domainEvent!.metadata
      expect(meta.ipHash).toBeNull()
      expect(meta.ua).toBe(expectedUserAgent.toString())
    })

    it('should authenticate and create a new user session correctly (revoke sessions)', async () => {
      const rawSession1 = makeRawSession({
        user_id: userId.toString(),
        revoked_at: null,
        expires_at: new Date(now.getTime() + refreshTtl),
        created_at: new Date(now.getTime() - 10),
      })

      const rawSession2 = makeRawSession({
        user_id: userId.toString(),
        revoked_at: null,
        expires_at: new Date(now.getTime() + refreshTtl),
        created_at: new Date(now.getTime() - 9),
      })

      const rawSession3 = makeRawSession({
        user_id: userId.toString(),
        revoked_at: null,
        expires_at: new Date(now.getTime() + refreshTtl),
        created_at: new Date(now.getTime() - 8),
      })

      const ipHash = await hasherService.hash('8.8.8.8')

      const rawSessionSameDevice = makeRawSession({
        user_id: userId.toString(),
        revoked_at: null,
        expires_at: new Date(now.getTime() + refreshTtl),
        ip_hash: ipHash,
        user_agent: 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko/2009032711 Ubuntu/9.04 (Jaunty Jackalope) Firefox/3.0.8',
        created_at: new Date(now.getTime()),
      })

      await userSessionRepository.save([rawSession1, rawSession2, rawSession3, rawSessionSameDevice])

      const useCase = buildUseCase()

      const activeSessionsBefore = await countUserSessions()

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'expected-password',
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko/2009032711 Ubuntu/9.04 (Jaunty Jackalope) Firefox/3.0.8',
      })

      const activeSessionsAfter = await countUserSessions()

      assertCommon(result, false, activeSessionsBefore, activeSessionsAfter)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sessionId: string = result.value!.sessionId

      const userSessions = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const revokedSessions = userSessions.filter((userSession) => userSession.revoked_at !== null).length

      const byId = new Map(userSessions.map((userSession) => [userSession.id, userSession]))

      const newUserSession = byId.get(sessionId)!
      const revokedSession = byId.get(rawSession1.id)!
      const nonRevokedSession1 = byId.get(rawSession2.id)!
      const nonRevokedSession2 = byId.get(rawSession3.id)!
      const nonRevokedSession3 = byId.get(rawSessionSameDevice.id)!

      const domainEvent = await domainEventRepository.findOneBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      const userCredential = await userCredentialRepository.findOneBy({
        user_id: userId.toString(),
      })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const expectedSessionHash = await hasherService.hash(result.value!.refreshToken as string)

      expect(revokedSessions).toBe(1)
      expect(revokedSession).toBeTruthy()
      expect(revokedSession.revoked_at).not.toBeNull()
      expect(nonRevokedSession1).toBeTruthy()
      expect(nonRevokedSession1.revoked_at).toBeNull()
      expect(nonRevokedSession2).toBeTruthy()
      expect(nonRevokedSession2.revoked_at).toBeNull()
      expect(nonRevokedSession3).toBeTruthy()
      expect(nonRevokedSession3.revoked_at).toBeNull()

      expect(newUserSession).toBeTruthy()
      expect(newUserSession.revoked_at).toBeNull()
      expect(newUserSession.id).toBe(sessionId)
      expect(newUserSession.user_id).toBe(userId.toString())
      expect(newUserSession.user_agent).toBe(
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko/2009032711 Ubuntu/9.04 (Jaunty Jackalope) Firefox/3.0.8',
      )
      expect(newUserSession.ip_hash).toBe(ipHash)
      expect(newUserSession.device_country).toBeNull()
      expect(newUserSession.device_city).toBeNull()
      expect(newUserSession.device_timezone).toBeNull()
      expect(newUserSession.token_hash).toBe(expectedSessionHash)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(newUserSession.token_hash).not.toBe(result.value!.refreshToken)
      expect(newUserSession.expires_at.getTime()).toBe(now.getTime() + refreshTtl)

      expect(userCredential).toBeTruthy()
      expect(userCredential!.last_login_at!.getTime()).toBe(now.getTime())
      expect(userCredential!.failed_attempts).toBe(0)
      expect(userCredential!.locked_until).toBeNull()

      expect(domainEvent).toBeTruthy()
      expect(domainEvent!.name).toBe(DomainEventName.successfulLogin().toString())
      expect(domainEvent!.aggregate_type).toBe(DomainEventAggregateType.user().toString())
      expect(domainEvent!.aggregate_id).toBe(userId.toString())

      const payload = domainEvent!.payload
      expect(payload.userId).toBe(userId.toString())
      expect(payload.sessionId).toBe(sessionId)
      expect(payload.isNewDevice).toBe(false)
      expect(payload.country).toBeNull()
      expect(payload.city).toBeNull()
      expect(payload.timezone).toBeNull()

      const meta = domainEvent!.metadata
      expect(meta.ipHash).toBe(ipHash)
      expect(meta.ua).toBe(
        'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko/2009032711 Ubuntu/9.04 (Jaunty Jackalope) Firefox/3.0.8',
      )
    })
  })

  describe('when there are errors', () => {
    const getUserCredential = async () => {
      return userCredentialRepository.findOneBy({
        user_id: userId.toString(),
      })
    }

    it('should return error when password is incorrect', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await countUserSessions()
      const userCredentialBefore = await getUserCredential()

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'another-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const activeSessionsAfter = await countUserSessions()
      const userCredentialAfter = await getUserCredential()

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.invalidCredentials(userId.toString()),
      })

      expect(activeSessionsBefore).toBe(activeSessionsAfter)
      expect(activeSessionsBefore).not.toBeGreaterThan(maxSessions)
      expect(userCredentialBefore).toEqual(userCredentialAfter)
    })

    it('should return error when password is incorrect', async () => {
      const useCase = buildUseCase()

      const activeSessionsBefore = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const userCredentialBefore = await getUserCredential()

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'another-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const activeSessionsAfter = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const userCredentialAfter = await getUserCredential()

      const domainEvent = await domainEventRepository.findOneBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.invalidCredentials(userId.toString()),
      })

      expect(activeSessionsBefore).toEqual(activeSessionsAfter)
      expect(activeSessionsBefore.length).not.toBeGreaterThan(maxSessions)
      expect(userCredentialBefore).toEqual(userCredentialAfter)
      expect(domainEvent).toBeTruthy()
      expect(domainEvent!.name).toBe(DomainEventName.failedLoginAttempt().toString())
    })

    it('should return error when user is not found', async () => {
      const useCase = buildUseCase()

      const anotherUserEmail = UserEmailMother.random()

      const sessionsBefore = await userSessionRepository.find()
      const eventsBefore = await domainEventRepository.find()

      const result = await useCase.execute({
        email: anotherUserEmail.toString(),
        password: 'expected-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const sessionsAfter = await userSessionRepository.find()
      const eventsAfter = await domainEventRepository.find()

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.userNotFound(anotherUserEmail.toString()),
      })
      expect(sessionsBefore).toEqual(sessionsAfter)
      expect(eventsBefore).toEqual(eventsAfter)
    })

    it('should return error when user is not active', async () => {
      const deactivateUser = { ...rawUser, status: UserStatus.deactivated().toString() }
      await userRepository.save(deactivateUser)

      const useCase = buildUseCase()

      const sessionsBefore = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const eventsBefore = await domainEventRepository.findBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'expected-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const sessionsAfter = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const eventsAfter = await domainEventRepository.findBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.userNotFound(userEmail.toString()),
      })
      expect(sessionsBefore).toEqual(sessionsAfter)
      expect(eventsBefore).toEqual(eventsAfter)
    })

    it('should return error when user does not have credentials', async () => {
      await userCredentialRepository.delete({
        user_id: userId.toString(),
      })

      const useCase = buildUseCase()

      const sessionsBefore = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const eventsBefore = await domainEventRepository.findBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      const result = await useCase.execute({
        email: userEmail.toString(),
        password: 'expected-password',
        ip: '127.0.0.0',
        userAgent: expectedUserAgent.toString(),
      })

      const sessionsAfter = await userSessionRepository.findBy({
        user_id: userId.toString(),
      })
      const eventsAfter = await domainEventRepository.findBy({
        aggregate_id: userId.toString(),
        aggregate_type: DomainEventAggregateType.user().toString(),
      })

      expect(result).toEqual({
        success: false,
        error: LoginUserApplicationError.userDoesNotHaveCredentials(userId.toString()),
      })
      expect(sessionsBefore).toEqual(sessionsAfter)
      expect(eventsBefore).toEqual(eventsAfter)
    })
  })
})
