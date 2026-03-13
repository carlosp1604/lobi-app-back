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
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { PostgreSqlProfileRepository } from '~/src/modules/User/Infrastructure/Profile/PostgreSqlProfileRepository'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { CreateUser } from '~/src/modules/Auth/Application/CreateUser/CreateUser'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
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

describe('CreateUser', () => {
  const now = new Date('2026-02-17T12:00:00Z')
  const validPassword = UserPasswordMother.valid()
  const validUserUsername = UserUsernameMother.valid()
  const validUserName = UserNameMother.valid()
  const validEmail = EmailAddressMother.valid()
  const anotherValidEmail = EmailAddressMother.random()
  const validTokenValue = VerificationTokenValueMother.valid()

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
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  const passwordHasher = new BCryptHasherService(env.SALT_ROUNDS)
  const idGenerator = new NodeIdGeneratorService()
  const authDomainEventFactory = new AuthDomainEventFactory(idGenerator)
  const loggerService = new LoggerServiceMock()
  const verifyTokenService = new VerifyTokenService(passwordHasher)

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockReset(mockedRequestOriginService)

    mockedResolver.resolve.mockReturnValue(runner.manager)

    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(runner.manager)
    sportsmanProfileDatabaseHelper = new SportsmanProfileDatabaseHelper(runner.manager)
    ownerProfileDatabaseHelper = new OwnerProfileDatabaseHelper(runner.manager)
    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    mockedRequestOriginService.process.mockResolvedValue({
      userAgent: UserAgentMother.valid(),
      ipHash: 'ip-hash',
      normalizedIp: 'normalized-ip',
      deviceLocation: null,
    })

    const tokenHash = await passwordHasher.hash(validTokenValue.value)

    existingRawToken = makeRawVerificationToken({
      email: validEmail.value,
      token_hash: tokenHash,
      purpose: VerificationTokenPurpose.createAccount().value,
      expires_at: new Date(now.getTime() + 3600),
      created_at: now,
      used_at: null,
    })

    existingRawUser = makeRawUser({
      email: anotherValidEmail.value,
      username: UserUsernameMother.random().value,
      name: UserNameMother.random().value,
      role: UserRole.sportsman().value,
    })

    baseRequest = {
      email: validEmail.value,
      username: validUserUsername.value,
      name: validUserName.value,
      password: validPassword.value,
      token: validTokenValue.value,
      requestedRole: UserRoleMother.sportsman().value,
      ip: '127.0.0.1',
      userAgent: UserAgentMother.forTesting().value,
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
      mockedRequestOriginService,
      new ClockServiceMock(now),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      loggerService,
      idGenerator,
      authDomainEventFactory,
    )
  }

  describe('happy path', () => {
    beforeEach(async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)
      await userDatabaseHelper.save(existingRawUser)
    })

    const testCase = async (request: CreateUserApplicationRequestDto, expectedOwnerProfile: boolean) => {
      const useCase = buildUseCase()

      const usersCountBefore = await userDatabaseHelper.count()
      const userCredentialsBefore = await userCredentialDatabaseHelper.count()
      const userDomainEventsBefore = await domainEventDatabaseHelper.count()
      const sportsmanProfilesBefore = await sportsmanProfileDatabaseHelper.count()
      const ownerProfilesBefore = await ownerProfileDatabaseHelper.count()
      const verificationTokensBefore = await verificationTokenDatabaseHelper.count()

      const result = await useCase.execute(request)

      const usersCountAfter = await userDatabaseHelper.count()
      const userCredentialsAfter = await userCredentialDatabaseHelper.count()
      const userDomainEventsAfter = await domainEventDatabaseHelper.count()
      const sportsmanProfilesAfter = await sportsmanProfileDatabaseHelper.count()
      const ownerProfilesAfter = await ownerProfileDatabaseHelper.count()
      const verificationTokensAfter = await verificationTokenDatabaseHelper.count()

      expect(usersCountBefore).toEqual(1)
      expect(userCredentialsBefore).toEqual(0)
      expect(userDomainEventsBefore).toEqual(0)
      expect(sportsmanProfilesBefore).toEqual(0)
      expect(ownerProfilesBefore).toEqual(0)
      expect(verificationTokensBefore).toEqual(1)

      expect(usersCountAfter).toEqual(2)
      expect(userCredentialsAfter).toEqual(1)
      expect(userDomainEventsAfter).toEqual(1)
      expect(sportsmanProfilesAfter).toEqual(1)
      expect(ownerProfilesAfter).toEqual(expectedOwnerProfile ? 1 : 0)
      expect(verificationTokensAfter).toEqual(1)

      expect(result.success).toBe(true)

      const createdUser = await userDatabaseHelper.findByEmail(validEmail.value)

      expect(createdUser).not.toBeNull()
      expect(createdUser!.username).toBe(validUserUsername.value)

      const credential = await userCredentialDatabaseHelper.findUserCredential(createdUser!.id)
      expect(credential).not.toBeNull()
      const isPasswordCorrect = await passwordHasher.compare(validPassword.value, credential!.password_hash)
      expect(isPasswordCorrect).toBe(true)

      const sportsmanProfile = await sportsmanProfileDatabaseHelper.findByUserId(createdUser!.id)
      expect(sportsmanProfile).toBeDefined()

      if (expectedOwnerProfile) {
        const ownerProfile = await ownerProfileDatabaseHelper.findByUserId(createdUser!.id)
        expect(ownerProfile).toBeDefined()
      }

      const updatedToken = await verificationTokenDatabaseHelper.findOneByEmail(validEmail.value)
      expect(updatedToken).not.toBeNull()
      expect(updatedToken!.used_at).toEqual(now)

      const events = await domainEventDatabaseHelper.findByAggregateTypeAndId(createdUser!.id, DomainEventAggregateType.user().value)
      expect(events.length).toBe(1)
      expect(events[0].name).toBe(DomainEventName.successfulSignup().value)

      const existingUserInDB = await userDatabaseHelper.findByEmail(anotherValidEmail.value)
      expect(existingUserInDB).not.toBeNull()
      expect(existingUserInDB!.username).toBe(existingRawUser.username)
      expect(existingUserInDB!.name).toBe(existingRawUser.name)
      expect(existingUserInDB!.role).toBe(existingRawUser.role)
      expect(existingUserInDB!.status).toBe(existingRawUser.status)
    }

    it('should save user, credential, profile, event and update token correctly (sportsman)', async () => {
      await testCase(baseRequest, false)
    })

    it('should save user, credential, profile, event and update token correctly (owner)', async () => {
      await testCase({ ...baseRequest, requestedRole: UserRoleMother.owner().value }, true)
    })
  })

  describe('when data is duplicated', () => {
    beforeEach(async () => {
      await userDatabaseHelper.save(existingRawUser)
    })

    const assertNoChangesInDatabase = async (tokenEmail: string) => {
      const usersCountAfter = await userDatabaseHelper.count()
      const userCredentialsAfter = await userCredentialDatabaseHelper.count()
      const userDomainEventsAfter = await domainEventDatabaseHelper.count()
      const sportsmanProfilesAfter = await sportsmanProfileDatabaseHelper.count()
      const verificationTokensAfter = await verificationTokenDatabaseHelper.count()

      expect(usersCountAfter).toEqual(1)
      expect(userCredentialsAfter).toEqual(0)
      expect(userDomainEventsAfter).toEqual(0)
      expect(sportsmanProfilesAfter).toEqual(0)
      expect(verificationTokensAfter).toEqual(1)

      const token = await verificationTokenDatabaseHelper.findOneByEmail(tokenEmail)
      expect(token).not.toBeNull()
      expect(token!.used_at).toBeNull()
    }

    it('should return error and not save anything when email is duplicated', async () => {
      await verificationTokenDatabaseHelper.save({ ...existingRawToken, email: existingRawUser.email })

      const useCase = buildUseCase()

      const requestWithDuplicatedEmail: CreateUserApplicationRequestDto = {
        ...baseRequest,
        email: existingRawUser.email,
      }

      const result = await useCase.execute(requestWithDuplicatedEmail)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        CreateUserApplicationError.duplicated([CreateUserError.duplicatedEmail(existingRawUser.email)]),
      )

      await assertNoChangesInDatabase(existingRawUser.email)
    })

    it('should return error and not save anything when username is duplicated', async () => {
      await verificationTokenDatabaseHelper.save(existingRawToken)

      const useCase = buildUseCase()

      const requestWithDuplicatedUsername: CreateUserApplicationRequestDto = {
        ...baseRequest,
        username: existingRawUser.username,
      }

      const result = await useCase.execute(requestWithDuplicatedUsername)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        CreateUserApplicationError.duplicated([CreateUserError.duplicatedUsername(existingRawUser.username)]),
      )

      await assertNoChangesInDatabase(existingRawToken.email)
    })
  })
})
