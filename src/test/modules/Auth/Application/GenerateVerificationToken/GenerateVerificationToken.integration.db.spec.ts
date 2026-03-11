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
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
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
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { HashMother } from '~/src/test/mothers/HashMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-31T10:50:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const pastDate = new Date(now.getTime() - 3600)
  const expectedExpiresAt = new Date(now.getTime() + env.VERIFICATION_TOKEN_TTL_MS)
  const expectedExpirationMinutes = env.VERIFICATION_TOKEN_TTL_MS / (60 * 1000)

  const email = EmailAddressMother.valid()
  const expectedUserAgent = UserAgentMother.random()
  const expectedDeviceLocation = DeviceLocationMother.valid()
  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()
  const expectedIpHash = HashMother.valid().toString()

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedConfigService = mock<ConfigService>()
  const mockedEmailSenderService = mock<EmailSenderServiceInterface>()
  const mockedRequestOriginService = mock<RequestOriginApplicationService>()

  let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
  let domainEventDatabaseHelper: DomainEventDatabaseHelper

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
    mockReset(mockedRequestOriginService)

    mockedResolver.resolve.mockReturnValue(runner.manager)
    mockedEmailSenderService.sendWithTemplate.mockResolvedValue(undefined)

    mockedRequestOriginService.process.mockResolvedValue({
      ipHash: expectedIpHash,
      normalizedIp: '127.0.0.0',
      deviceLocation: expectedDeviceLocation,
      userAgent: expectedUserAgent,
    })

    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({
        VERIFICATION_TOKEN_TTL_MS: env.VERIFICATION_TOKEN_TTL_MS,
      }),
    )

    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    request = {
      email: email.toString(),
      purpose: purposeCreateAccount.toString(),
      sendNewToken: false,
      ip: '127.0.0.0',
      userAgent: expectedUserAgent.toString(),
    }

    currentVerificationToken = makeRawVerificationToken({
      id: IdentifierMother.valid().toString(),
      purpose: purposeCreateAccount.toString(),
      token_hash: VerificationTokenTokenHashMother.random().toString(),
      email: email.toString(),
      expires_at: futureExpiresAt,
      used_at: null,
      created_at: pastDate,
    })

    currentDomainEvent = makeRawDomainEvent({
      id: IdentifierMother.valid().value,
      metadata: {},
      aggregate_id: currentVerificationToken.id,
      aggregate_type: DomainEventAggregateType.verificationToken().value,
      name: DomainEventName.emailVerificationRequest().value,
      payload: {
        email: email.value,
        purpose: purposeCreateAccount.value,
        resendCode: false,
      },
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
      mockedRequestOriginService,
      new ClockServiceMock(now),
      new NodeRandomService(),
      mockedConfigService,
      loggerService,
      idGenerator,
      new AuthDomainEventFactory(idGenerator),
    )
  }

  const runTestAndGetResults = async (request: GenerateVerificationTokenApplicationRequestDto) => {
    const useCase = buildUseCase()

    const verificationTokensBefore = await verificationTokenDatabaseHelper.findByEmail(email.value)
    const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateType(DomainEventAggregateType.verificationToken().value)

    const result = await useCase.execute(request)

    const verificationTokensAfter = await verificationTokenDatabaseHelper.findByEmail(email.value)
    const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateType(DomainEventAggregateType.verificationToken().value)

    return { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter }
  }

  describe('happy path', () => {
    const testCase = async (
      existingToken: VerificationTokenRawModel | null,
      sendNewToken: boolean,
      initialDomainEventsNumber: number,
      initialTokensNumber: number,
      expectedTotalTokens: number,
    ) => {
      if (existingToken) {
        await verificationTokenDatabaseHelper.save(existingToken)
        await domainEventDatabaseHelper.save(currentDomainEvent)
      }

      const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
        await runTestAndGetResults({ ...request, sendNewToken })

      expect(result).toEqual({
        success: true,
        value: undefined,
      })

      expect(domainEventsBefore.length).toBe(initialDomainEventsNumber)
      expect(verificationTokensBefore.length).toBe(initialTokensNumber)

      expect(verificationTokensAfter.length).toBe(expectedTotalTokens)
      expect(domainEventsAfter.length).toBe(domainEventsBefore.length + 1)

      const savedVerificationToken = existingToken
        ? verificationTokensAfter.find((t) => t.id !== existingToken.id)
        : verificationTokensAfter[0]
      expect(savedVerificationToken).toBeDefined()
      expect(savedVerificationToken!.email).toBe(email.value)
      expect(savedVerificationToken!.purpose).toBe(purposeCreateAccount.value)
      expect(savedVerificationToken!.expires_at).toEqual(expectedExpiresAt)
      expect(savedVerificationToken!.used_at).toBeNull()

      const savedDomainEvent = domainEventsAfter.find((domainEvent) => domainEvent.aggregate_id === savedVerificationToken!.id)
      expect(savedDomainEvent).toBeDefined()
      expect(savedDomainEvent!.aggregate_id).toEqual(savedVerificationToken!.id)
      expect(savedDomainEvent!.name).toEqual(DomainEventName.emailVerificationRequest().value)
      expect(savedDomainEvent!.aggregate_type).toEqual(DomainEventAggregateType.verificationToken().value)

      expect(savedDomainEvent!.payload).toEqual({
        email: email.value,
        purpose: purposeCreateAccount.value,
        resendCode: existingToken ? sendNewToken : false,
        // TODO: Use expected language when multi-language emails are supported
        lang: 'es',
        deviceLocation: {
          city: expectedDeviceLocation.city,
          countryCode: expectedDeviceLocation.countryCode,
        },
      })

      expect(savedDomainEvent!.metadata).toEqual({
        ipHash: expectedIpHash,
        ua: expectedUserAgent.value,
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledTimes(1)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEmailSenderService.sendWithTemplate).toHaveBeenCalledWith(
        email.value,
        'verify-email-template-create-account',
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          token: expect.any(String),
          expiration_minutes: expectedExpirationMinutes,
        },
        // TODO: Use expected language when multi-language emails are supported
        'es',
        now,
      )

      if (expectedTotalTokens > initialTokensNumber && existingToken) {
        const oldTokenStillExists = verificationTokensAfter.some((t) => t.id === existingToken.id)
        expect(oldTokenStillExists).toBe(true)
      }
    }

    it('should create a new verification token when an active token does not exist', async () => {
      await testCase(null, true, 0, 0, 1)
    })

    describe('when an active token exists', () => {
      it('should create a new verification token when active token is usable and sendNewToken is true', async () => {
        await testCase(currentVerificationToken, true, 1, 1, 1)
      })

      it('should create a new verification token when active token is NOT usable (expired) and sendNewToken is false', async () => {
        const expiredToken = {
          ...currentVerificationToken,
          expires_at: pastDate,
          used_at: null,
        }

        await testCase(expiredToken, false, 1, 1, 1)
      })

      it('should create a new verification token AND PRESERVE HISTORY when active token is already used', async () => {
        const usedToken = {
          ...currentVerificationToken,
          used_at: pastDate,
          expires_at: futureExpiresAt,
        }

        await testCase(usedToken, false, 1, 1, 2)
      })
    })
  })

  describe('when there are errors', () => {
    let rawUser: UserRawModelWithRelations
    let userDatabaseHelper: UserDatabaseHelper

    beforeEach(() => {
      rawUser = makeRawUser({
        email: email.value,
        deleted_at: null,
        status: UserStatus.active().value,
      })

      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    })

    it('should return error when purpose is createAccount and email is already taken', async () => {
      await userDatabaseHelper.save(rawUser)

      const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
        await runTestAndGetResults(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.value))

      expect(verificationTokensBefore.length).toBe(0)
      expect(verificationTokensAfter.length).toBe(0)
      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsAfter.length).toBe(0)
    })

    describe('when purpose is resetPassword and user does not exist, is deleted or is not active', () => {
      const testCase = async () => {
        const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
          await runTestAndGetResults({ ...request, purpose: purposeResetPassword.value })

        expect(result).toEqual({
          success: true,
          value: undefined,
        })

        expect(verificationTokensBefore.length).toBe(0)
        expect(verificationTokensAfter.length).toBe(0)
        expect(domainEventsBefore.length).toBe(0)
        expect(domainEventsAfter.length).toBe(0)
      }

      it('should return success when user does not exist', async () => {
        await testCase()
      })

      it('should return success when user is deleted', async () => {
        await userDatabaseHelper.save({ ...rawUser, deleted_at: pastDate })
        await testCase()
      })

      it('should return success when user is not active', async () => {
        await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().value })
        await testCase()
      })
    })

    it('should return error when token exists, is usable, and sendNewToken is false', async () => {
      await verificationTokenDatabaseHelper.save(currentVerificationToken)
      await domainEventDatabaseHelper.save(currentDomainEvent)

      const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
        await runTestAndGetResults({ ...request, sendNewToken: false })

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.value, purposeCreateAccount.value),
      })

      expect(verificationTokensBefore.length).toBe(1)
      expect(domainEventsBefore.length).toBe(1)
      expect(verificationTokensAfter.length).toBe(1)
      expect(domainEventsAfter.length).toBe(1)
      expect(verificationTokensBefore).toEqual([currentVerificationToken])
      expect(verificationTokensAfter).toEqual([currentVerificationToken])
      expect(domainEventsBefore).toEqual([currentDomainEvent])
      expect(domainEventsAfter).toEqual([currentDomainEvent])
    })
  })
})
