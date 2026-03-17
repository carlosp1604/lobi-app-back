import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { NodeRandomService } from '~/src/modules/Shared/Infrastructure/Services/NodeRandomService'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'
import { ConfigService } from '@nestjs/config'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { GenerateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationRequestDto'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { makeRawDomainEvent } from '~/src/test/modules/Shared/Infrastructure/DomainEventRawTestMaker'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { EmailSenderServiceInterface } from '~/src/modules/Shared/Domain/EmailSenderServiceInterface'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-31T10:50:00Z')

  const futureDate = new Date(now.getTime() + 3600)
  const pastDate = new Date(now.getTime() - 3600)
  const expectedExpiresAt = new Date(now.getTime() + env.VERIFICATION_TOKEN_TTL_MS)

  const email = EmailAddressMother.valid()
  const userIpHash = UserIpHashMother.valid()
  const userAgent = UserAgentMother.random()
  const deviceLocation = DeviceLocationMother.valid()

  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()
  const verificationTokenDomainAggregateType = DomainEventAggregateType.verificationToken().value

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedConfigService = mock<ConfigService>()
  const mockedEmailSenderService = mock<EmailSenderServiceInterface>()

  let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper
  let userDatabaseHelper: UserDatabaseHelper

  let request: GenerateVerificationTokenApplicationRequestDto
  let currentVerificationToken: VerificationTokenRawModel
  let currentDomainEvent: DomainEventRawModel

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedEmailSenderService)

    mockedResolver.resolve.mockReturnValue(runner.manager)
    mockedEmailSenderService.sendWithTemplate.mockResolvedValue(undefined)

    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({ VERIFICATION_TOKEN_TTL_MS: env.VERIFICATION_TOKEN_TTL_MS }),
    )

    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)
    userDatabaseHelper = new UserDatabaseHelper(runner.manager)

    request = {
      email: email.value,
      purpose: purposeCreateAccount.value,
      sendNewToken: false,
      clientMetadata: new ClientMetadataResponseTestBuilder()
        .withUserAgent(userAgent)
        .withDeviceLocation(deviceLocation)
        .withUserIpHash(userIpHash)
        .build(),
    }

    currentVerificationToken = makeRawVerificationToken({
      id: IdentifierMother.valid().value,
      purpose: purposeCreateAccount.value,
      token_hash: VerificationTokenTokenHashMother.random().value,
      email: email.value,
      expires_at: futureDate,
      used_at: null,
      created_at: pastDate,
    })

    currentDomainEvent = makeRawDomainEvent({
      id: IdentifierMother.valid().value,
      metadata: {},
      aggregate_id: currentVerificationToken.id,
      aggregate_type: DomainEventAggregateType.verificationToken().value,
      name: DomainEventName.emailVerificationRequest().value,
      payload: {},
      occurred_at: pastDate,
    })
  })

  const loggerService = new LoggerServiceMock()
  const hasherService = new BCryptHasherService(env.SALT_ROUNDS)
  const idGenerator = new NodeIdGeneratorService()

  const buildUseCase = () => {
    return new GenerateVerificationToken(
      new PostgreSqlVerificationTokenRepository(mockedResolver),
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      mockedEmailSenderService,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      hasherService,
      new ClockServiceMock(now),
      new NodeRandomService(),
      mockedConfigService,
      loggerService,
      idGenerator,
      new AuthDomainEventFactory(idGenerator),
    )
  }

  const runTestWithCount = async (
    requestDto: GenerateVerificationTokenApplicationRequestDto,
    expectedCounts: {
      tokens: { before: number; after: number }
      events: { before: number; after: number }
    },
  ) => {
    const useCase = buildUseCase()

    const tokensBefore = await verificationTokenDatabaseHelper.count()
    const eventsBefore = await domainEventDatabaseHelper.count()

    const result = await useCase.execute(requestDto)

    const tokensAfter = await verificationTokenDatabaseHelper.count()
    const eventsAfter = await domainEventDatabaseHelper.count()

    expect(tokensBefore).toEqual(expectedCounts.tokens.before)
    expect(tokensAfter).toEqual(expectedCounts.tokens.after)
    expect(eventsBefore).toEqual(expectedCounts.events.before)
    expect(eventsAfter).toEqual(expectedCounts.events.after)

    return result
  }

  describe('happy path', () => {
    const assertSavedTokenAndEvent = async (resendCode: boolean, expectedOldTokenIdToSurvive?: string) => {
      const savedTokens = await verificationTokenDatabaseHelper.findByEmail(email.value)

      const newToken = expectedOldTokenIdToSurvive ? savedTokens.find((t) => t.id !== expectedOldTokenIdToSurvive) : savedTokens[0]

      expect(newToken).toBeDefined()
      expect(newToken!.email).toBe(email.value)
      expect(newToken!.purpose).toBe(request.purpose)
      expect(newToken!.expires_at).toEqual(expectedExpiresAt)
      expect(newToken!.used_at).toBeNull()

      const savedEvents = await domainEventDatabaseHelper.findByAggregateTypeAndId(newToken!.id, verificationTokenDomainAggregateType)
      expect(savedEvents).toHaveLength(1)

      const savedEvent = savedEvents[0]
      expect(savedEvent.name).toEqual(DomainEventName.emailVerificationRequest().value)
      expect(savedEvent.payload).toEqual(
        expect.objectContaining({
          email: email.value,
          purpose: request.purpose,
          resendCode,
          lang: 'es',
          deviceLocation: {
            city: deviceLocation.city,
            countryCode: deviceLocation.countryCode,
          },
        }),
      )
      expect(savedEvent.metadata).toEqual(
        expect.objectContaining({
          ipHash: userIpHash.value,
          ua: userAgent.value,
        }),
      )

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledTimes(1)
    }

    it('should create a new verification token when an active token does not exist', async () => {
      const result = await runTestWithCount(request, {
        tokens: { before: 0, after: 1 },
        events: { before: 0, after: 1 },
      })

      expect(result.success).toBe(true)
      await assertSavedTokenAndEvent(false)
    })

    describe('when an active token exists', () => {
      it('should create a new verification token and delete the old one when active token is usable and sendNewToken is true', async () => {
        await verificationTokenDatabaseHelper.save(currentVerificationToken)
        await domainEventDatabaseHelper.save(currentDomainEvent)

        const result = await runTestWithCount(
          { ...request, sendNewToken: true },
          {
            tokens: { before: 1, after: 1 },
            events: { before: 1, after: 2 },
          },
        )

        expect(result.success).toBe(true)
        await assertSavedTokenAndEvent(true)

        const updatedOldToken = await verificationTokenDatabaseHelper.findById(currentVerificationToken.id)
        expect(updatedOldToken).toBeNull()
      })

      it('should create a new verification token and delete the old one when active token is not usable (expired) and sendNewToken is false', async () => {
        const expiredToken = { ...currentVerificationToken, expires_at: pastDate }
        await verificationTokenDatabaseHelper.save(expiredToken)

        const result = await runTestWithCount(request, {
          tokens: { before: 1, after: 1 },
          events: { before: 0, after: 1 },
        })

        expect(result.success).toBe(true)
        await assertSavedTokenAndEvent(false)

        const updatedOldToken = await verificationTokenDatabaseHelper.findById(expiredToken.id)
        expect(updatedOldToken).toBeNull()
      })

      it('should create a new verification token and do not delete de old one when active token is already used', async () => {
        const usedToken = { ...currentVerificationToken, used_at: pastDate }
        await verificationTokenDatabaseHelper.save(usedToken)

        const result = await runTestWithCount(request, {
          tokens: { before: 1, after: 2 },
          events: { before: 0, after: 1 },
        })

        expect(result.success).toBe(true)
        await assertSavedTokenAndEvent(false, usedToken.id)

        const updatedOldToken = await verificationTokenDatabaseHelper.findById(usedToken.id)
        expect(updatedOldToken).not.toBeNull()
        expect(updatedOldToken!.used_at).toEqual(pastDate)
      })
    })
  })

  describe('when there are errors', () => {
    let rawUser: UserRawModelWithRelations

    beforeEach(() => {
      rawUser = makeRawUser({ email: email.value, deleted_at: null, status: UserStatus.active().value })
    })

    it('should return error when purpose is createAccount and email is already taken', async () => {
      await userDatabaseHelper.save(rawUser)

      const result = await runTestWithCount(request, {
        tokens: { before: 0, after: 0 },
        events: { before: 0, after: 0 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.value))
    })

    describe('when purpose is resetPassword and user does not exist or is not active', () => {
      it('should return error when user does not exist', async () => {
        const result = await runTestWithCount(
          { ...request, purpose: purposeResetPassword.value },
          {
            tokens: { before: 0, after: 0 },
            events: { before: 0, after: 0 },
          },
        )

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(GenerateVerificationTokenApplicationError.userNotFound(email.value))
      })

      it('should return error when user is not active', async () => {
        await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })

        const result = await runTestWithCount(
          { ...request, purpose: purposeResetPassword.value },
          {
            tokens: { before: 0, after: 0 },
            events: { before: 0, after: 0 },
          },
        )

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(GenerateVerificationTokenApplicationError.userDisabled(email.value))
      })
    })

    it('should return error when token exists, is usable, and sendNewToken is false', async () => {
      await verificationTokenDatabaseHelper.save(currentVerificationToken)
      await domainEventDatabaseHelper.save(currentDomainEvent)

      const result = await runTestWithCount(request, {
        tokens: { before: 1, after: 1 },
        events: { before: 1, after: 1 },
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.value, purposeCreateAccount.value),
      )
    })
  })
})
