import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { SportsmanProfileDatabaseHelper } from '~/src/test/modules/User/Infrastructure/Profile/SportsmanProfileDatabaseHelper'
import { OwnerProfileDatabaseHelper } from '~/src/test/modules/User/Infrastructure/Profile/OwnerProfileDatabaseHelper'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlProfileRepository } from '~/src/modules/User/Infrastructure/Profile/PostgreSqlProfileRepository'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { CreateUserApplicationRequestDto } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationRequestDto'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { CreateUserApplicationError, CreateUserError } from '~/src/modules/Auth/Application/CreateUser/CreateUserApplicationError'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'

describe('CreateUser', () => {
  const now = new Date('2026-02-17T12:00:00Z')

  const userPassword = UserPasswordMother.valid()
  const userUsername = UserUsernameMother.valid()
  const userName = UserNameMother.valid()
  const userEmail = EmailAddressMother.valid()
  const anotherUserEmail = EmailAddressMother.random()
  const tokenValue = VerificationTokenValueMother.valid()

  let userDatabaseHelper: UserDatabaseHelper
  let userCredentialDatabaseHelper: UserCredentialDatabaseHelper
  let sportsmanProfileDatabaseHelper: SportsmanProfileDatabaseHelper
  let ownerProfileDatabaseHelper: OwnerProfileDatabaseHelper
  let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

  let existingRawToken: VerificationTokenRawModel
  let existingRawUser: UserRawModelWithRelations
  let baseRequest: CreateUserApplicationRequestDto

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  const passwordHasher = new BCryptHasherService(env.SALT_ROUNDS)
  const idGenerator = new NodeIdGeneratorService()
  const authDomainEventFactory = new AuthDomainEventFactory(idGenerator)
  const loggerService = new LoggerServiceMock()
  const verifyTokenService = new VerifyTokenService(passwordHasher)

  beforeEach(async () => {
    mockReset(mockedResolver)

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(runner.manager)
    sportsmanProfileDatabaseHelper = new SportsmanProfileDatabaseHelper(runner.manager)
    ownerProfileDatabaseHelper = new OwnerProfileDatabaseHelper(runner.manager)
    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    const tokenHash = await passwordHasher.hash(tokenValue.value)

    existingRawToken = makeRawVerificationToken({
      email: userEmail.value,
      token_hash: tokenHash,
      purpose: VerificationTokenPurpose.createAccount().value,
      expires_at: new Date(now.getTime() + 3600),
      created_at: now,
      used_at: null,
    })

    existingRawUser = makeRawUser({
      email: anotherUserEmail.value,
      username: UserUsernameMother.random().value,
      name: UserNameMother.random().value,
      role: UserRole.sportsman().value,
    })

    baseRequest = {
      email: userEmail.value,
      username: userUsername.value,
      name: userName.value,
      password: userPassword.value,
      token: tokenValue.value,
      requestedRole: UserRoleMother.sportsman().value,
      clientMetadata: new ClientMetadataResponseTestBuilder().build(),
    }
  })

  const buildUseCase = () => {
    return new CreateUser(
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlUserCredentialRepository(mockedResolver),
      new PostgreSqlProfileRepository(mockedResolver),
      new PostgreSqlVerificationTokenRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      verifyTokenService,
      passwordHasher,
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      idGenerator,
      authDomainEventFactory,
    )
  }

  const runTestWithCount = async (
    requestDto: CreateUserApplicationRequestDto,
    expectedCounts: {
      users: { before: number; after: number }
      credentials: { before: number; after: number }
      events: { before: number; after: number }
      sportsmanProfiles: { before: number; after: number }
      ownerProfiles: { before: number; after: number }
      tokens: { before: number; after: number }
    },
  ) => {
    const useCase = buildUseCase()

    const usersBefore = await userDatabaseHelper.count()
    const credentialsBefore = await userCredentialDatabaseHelper.count()
    const eventsBefore = await domainEventDatabaseHelper.count()
    const sportsmanBefore = await sportsmanProfileDatabaseHelper.count()
    const ownerBefore = await ownerProfileDatabaseHelper.count()
    const tokensBefore = await verificationTokenDatabaseHelper.count()

    const result = await useCase.execute(requestDto)

    const usersAfter = await userDatabaseHelper.count()
    const credentialsAfter = await userCredentialDatabaseHelper.count()
    const eventsAfter = await domainEventDatabaseHelper.count()
    const sportsmanAfter = await sportsmanProfileDatabaseHelper.count()
    const ownerAfter = await ownerProfileDatabaseHelper.count()
    const tokensAfter = await verificationTokenDatabaseHelper.count()

    expect(usersBefore).toEqual(expectedCounts.users.before)
    expect(usersAfter).toEqual(expectedCounts.users.after)
    expect(credentialsBefore).toEqual(expectedCounts.credentials.before)
    expect(credentialsAfter).toEqual(expectedCounts.credentials.after)
    expect(eventsBefore).toEqual(expectedCounts.events.before)
    expect(eventsAfter).toEqual(expectedCounts.events.after)
    expect(sportsmanBefore).toEqual(expectedCounts.sportsmanProfiles.before)
    expect(sportsmanAfter).toEqual(expectedCounts.sportsmanProfiles.after)
    expect(ownerBefore).toEqual(expectedCounts.ownerProfiles.before)
    expect(ownerAfter).toEqual(expectedCounts.ownerProfiles.after)
    expect(tokensBefore).toEqual(expectedCounts.tokens.before)
    expect(tokensAfter).toEqual(expectedCounts.tokens.after)

    return result
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)
      await userDatabaseHelper.save(existingRawUser)
    })

    const assertHappyPathData = async (expectedOwnerProfile: boolean) => {
      const createdUser = await userDatabaseHelper.findByEmail(userEmail.value)
      expect(createdUser).not.toBeNull()
      expect(createdUser!.username).toBe(userUsername.value)

      const credential = await userCredentialDatabaseHelper.findUserCredential(createdUser!.id)
      expect(credential).not.toBeNull()
      const isPasswordCorrect = await passwordHasher.compare(userPassword.value, credential!.password_hash)
      expect(isPasswordCorrect).toBe(true)

      const sportsmanProfile = await sportsmanProfileDatabaseHelper.findByUserId(createdUser!.id)
      expect(sportsmanProfile).toBeDefined()

      if (expectedOwnerProfile) {
        const ownerProfile = await ownerProfileDatabaseHelper.findByUserId(createdUser!.id)
        expect(ownerProfile).toBeDefined()
      }

      const updatedToken = await verificationTokenDatabaseHelper.findOneByEmail(userEmail.value)
      expect(updatedToken).not.toBeNull()
      expect(updatedToken!.used_at).toEqual(now)

      const events = await domainEventDatabaseHelper.findByAggregateTypeAndId(createdUser!.id, DomainEventAggregateType.user().value)
      expect(events.length).toBe(1)
      expect(events[0].name).toBe(DomainEventName.successfulSignup().value)

      const existingUser = await userDatabaseHelper.findByEmail(anotherUserEmail.value)
      expect(existingUser).not.toBeNull()
      expect(existingUser!.username).toBe(existingRawUser.username)
      expect(existingUser!.email).toBe(existingRawUser.email)
    }

    it('should save user, credential, profile, event and update token correctly (sportsman)', async () => {
      const result = await runTestWithCount(baseRequest, {
        users: { before: 1, after: 2 },
        credentials: { before: 0, after: 1 },
        events: { before: 0, after: 1 },
        sportsmanProfiles: { before: 0, after: 1 },
        ownerProfiles: { before: 0, after: 0 },
        tokens: { before: 1, after: 1 },
      })

      expect(result).toEqual({ success: true, value: undefined })
      await assertHappyPathData(false)
    })

    it('should save user, credential, profile, event and update token correctly (owner)', async () => {
      const result = await runTestWithCount(
        { ...baseRequest, requestedRole: UserRoleMother.owner().value },
        {
          users: { before: 1, after: 2 },
          credentials: { before: 0, after: 1 },
          events: { before: 0, after: 1 },
          sportsmanProfiles: { before: 0, after: 1 },
          ownerProfiles: { before: 0, after: 1 },
          tokens: { before: 1, after: 1 },
        },
      )

      expect(result).toEqual({ success: true, value: undefined })
      await assertHappyPathData(true)
    })
  })

  describe('when data is duplicated', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save(existingRawUser)
    })

    it('should return error and not save anything when email is duplicated', async () => {
      await verificationTokenDatabaseHelper.save({ ...existingRawToken, email: existingRawUser.email })

      const requestWithDuplicatedEmail = { ...baseRequest, email: existingRawUser.email }

      const result = await runTestWithCount(requestWithDuplicatedEmail, {
        users: { before: 1, after: 1 },
        credentials: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
        sportsmanProfiles: { before: 0, after: 0 },
        ownerProfiles: { before: 0, after: 0 },
        tokens: { before: 1, after: 1 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CreateUserApplicationError.duplicated([CreateUserError.duplicatedEmail()]))

      const token = await verificationTokenDatabaseHelper.findOneByEmail(existingRawUser.email)
      expect(token!.used_at).toBeNull()
    })

    it('should return error and not save anything when username is duplicated', async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)

      const requestWithDuplicatedUsername = { ...baseRequest, username: existingRawUser.username }

      const result = await runTestWithCount(requestWithDuplicatedUsername, {
        users: { before: 1, after: 1 },
        credentials: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
        sportsmanProfiles: { before: 0, after: 0 },
        ownerProfiles: { before: 0, after: 0 },
        tokens: { before: 1, after: 1 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CreateUserApplicationError.duplicated([CreateUserError.duplicatedUsername()]))

      const token = await verificationTokenDatabaseHelper.findOneByEmail(existingRawToken.email)
      expect(token!.used_at).toBeNull()
    })
  })
})
