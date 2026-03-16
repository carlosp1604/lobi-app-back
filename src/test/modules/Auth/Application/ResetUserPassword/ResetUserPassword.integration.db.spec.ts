import { mock, mockReset } from 'jest-mock-extended'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { ResetUserPasswordApplicationRequestDto } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationRequestDto'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { ResetUserPassword } from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPassword'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import {
  ResetUserPasswordApplicationError,
  ResetUserPasswordError,
} from '~/src/modules/Auth/Application/ResetUserPassword/ResetUserPasswordApplicationError'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

describe('ResetUserPassword', () => {
  const now = new Date('2026-02-19T16:46:00Z')

  const validNewPassword = UserPasswordMother.valid()
  const validOldPassword = UserPasswordMother.random()
  const validEmail = EmailAddressMother.valid()
  const validTokenValue = VerificationTokenValueMother.valid()

  let userDatabaseHelper: UserDatabaseHelper
  let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
  let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

  let existingRawToken: VerificationTokenRawModel
  let existingRawUser: UserRawModelWithRelations
  let existingRawCredential: UserCredentialRawModel
  let baseRequest: ResetUserPasswordApplicationRequestDto

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const passwordHasher = new BCryptHasherService(env.SALT_ROUNDS)
  const domainEventFactory = new AuthDomainEventFactory(new NodeIdGeneratorService())
  const loggerService = new LoggerServiceMock()
  const verifyTokenService = new VerifyTokenService(passwordHasher)

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockReset(mockedRequestOriginService)

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(runner.manager)
    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    mockedRequestOriginService.process.mockResolvedValue({
      userAgent: UserAgentMother.valid(),
      ipHash: 'ip-hash',
      normalizedIp: 'normalized-ip',
      deviceLocation: null,
    })

    const tokenHash = await passwordHasher.hash(validTokenValue.value)
    const oldPasswordHash = await passwordHasher.hash(validOldPassword.value)

    existingRawToken = makeRawVerificationToken({
      email: validEmail.value,
      token_hash: tokenHash,
      purpose: VerificationTokenPurpose.resetPassword().value,
      expires_at: new Date(now.getTime() + 3600),
      created_at: now,
      used_at: null,
    })

    existingRawUser = makeRawUser({
      email: validEmail.value,
      username: UserUsernameMother.random().value,
      name: UserNameMother.random().value,
      role: UserRole.sportsman().value,
      status: UserStatus.active().value,
    })

    existingRawCredential = makeRawUserCredential({
      user_id: existingRawUser.id,
      password_hash: oldPasswordHash,
      created_at: now,
      updated_at: now,
    })

    baseRequest = {
      email: validEmail.value,
      token: validTokenValue.value,
      password: validNewPassword.value,
      ip: '127.0.0.1',
      userAgent: UserAgentMother.valid().raw,
    }
  })

  const buildUseCase = () => {
    return new ResetUserPassword(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserCredentialRepository(mockedResolver),
      new PostgreSqlVerificationTokenRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      verifyTokenService,
      passwordHasher,
      mockedRequestOriginService,
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      domainEventFactory,
    )
  }

  const runTestWithCount = async (expectedCounts: {
    credentials: { before: number; after: number }
    events: { before: number; after: number }
    tokens: { before: number; after: number }
  }) => {
    const useCase = buildUseCase()

    const userCredentialsBefore = await userCredentialDatabaseHelper.count()
    const userDomainEventsBefore = await domainEventDatabaseHelper.count()
    const verificationTokensBefore = await verificationTokenDatabaseHelper.count()

    const result = await useCase.execute(baseRequest)

    const userCredentialsAfter = await userCredentialDatabaseHelper.count()
    const userDomainEventsAfter = await domainEventDatabaseHelper.count()
    const verificationTokensAfter = await verificationTokenDatabaseHelper.count()

    expect(userCredentialsBefore).toEqual(expectedCounts.credentials.before)
    expect(userDomainEventsBefore).toEqual(expectedCounts.events.before)
    expect(verificationTokensBefore).toEqual(expectedCounts.tokens.before)

    expect(userCredentialsAfter).toEqual(expectedCounts.credentials.after)
    expect(userDomainEventsAfter).toEqual(expectedCounts.events.after)
    expect(verificationTokensAfter).toEqual(expectedCounts.tokens.after)

    return result
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)
      await userDatabaseHelper.save(existingRawUser)
      await userCredentialDatabaseHelper.save(existingRawCredential)
    })

    it('should save new credential, event and update token correctly', async () => {
      const result = await runTestWithCount({
        credentials: { before: 1, after: 1 },
        tokens: { before: 1, after: 1 },
        events: { before: 0, after: 1 },
      })

      expect(result.success).toBe(true)

      const updatedCredential = await userCredentialDatabaseHelper.findUserCredential(existingRawUser.id)
      expect(updatedCredential).not.toBeNull()
      const isPasswordCorrect = await passwordHasher.compare(validNewPassword.value, updatedCredential!.password_hash)
      expect(isPasswordCorrect).toBe(true)
      expect(updatedCredential!.updated_at).toEqual(now)

      const updatedToken = await verificationTokenDatabaseHelper.findOneByEmail(validEmail.value)
      expect(updatedToken).not.toBeNull()
      expect(updatedToken!.used_at).toEqual(now)

      const events = await domainEventDatabaseHelper.findByAggregateTypeAndId(existingRawUser.id, DomainEventAggregateType.user().value)
      expect(events.length).toBe(1)

      const createdEvent = events[0]
      expect(createdEvent.name).toBe(DomainEventName.successfulResetPassword().value)
      expect(createdEvent.aggregate_type).toBe(DomainEventAggregateType.user().value)
      expect(createdEvent.aggregate_id).toBe(existingRawUser.id)
    })
  })

  describe('when there are errors', () => {
    it('should return tokenNotFound error when verification token does not exist', async () => {
      await userDatabaseHelper.save(existingRawUser)
      await userCredentialDatabaseHelper.save(existingRawCredential)

      const result = await runTestWithCount({
        credentials: { before: 1, after: 1 },
        tokens: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.tokenNotFound(baseRequest.email)),
      )

      const credential = await userCredentialDatabaseHelper.findUserCredential(existingRawUser.id)
      expect(credential).not.toBeNull()
      expect(credential!.password_hash).toBe(existingRawCredential.password_hash)
    })

    it('should return userNotFound when user does not exist', async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)

      const result = await runTestWithCount({
        credentials: { before: 0, after: 0 },
        tokens: { before: 1, after: 1 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        ResetUserPasswordApplicationError.notFound(ResetUserPasswordError.userNotFound(baseRequest.email)),
      )

      const token = await verificationTokenDatabaseHelper.findById(existingRawToken.id)
      expect(token).not.toBeNull()
      expect(token!.used_at).toBeNull()
    })

    it('should return inconsistentState when user exists but does not have credentials', async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)
      await userDatabaseHelper.save(existingRawUser)

      const result = await runTestWithCount({
        credentials: { before: 0, after: 0 },
        tokens: { before: 1, after: 1 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(ResetUserPasswordApplicationError.inconsistentState(existingRawUser.id))

      const token = await verificationTokenDatabaseHelper.findById(existingRawToken.id)
      expect(token).not.toBeNull()
      expect(token!.used_at).toBeNull()
    })
  })
})
