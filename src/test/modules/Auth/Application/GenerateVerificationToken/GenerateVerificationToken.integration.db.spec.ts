import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { NodeHasherService } from '~/src/modules/Auth/Infrastructure/Services/NodeHasherService'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { GenerateVerificationToken } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationToken'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { ServerClient } from 'postmark'
import { PostmarkEmailSenderService } from '~/src/modules/Shared/Infrastructure/Services/PostmarkEmailSenderService'
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
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { DomainEventDatabaseHelper } from '~/src/test/modules/Shared/Infrastructure/DomainEventDatabaseHelper'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { makeRawDomainEvent } from '~/src/test/modules/Shared/Infrastructure/DomainEventRawTestMaker'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { GenerateVerificationTokenApplicationError } from '~/src/modules/Auth/Application/GenerateVerificationToken/GenerateVerificationTokenApplicationError'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'

describe('GenerateVerificationToken', () => {
  const now = new Date('2025-10-31T10:50:00Z')
  const futureExpiresAt = new Date(now.getTime() + 3600)
  const pastDate = new Date(now.getTime() - 3600)
  const expectedExpiresAt = new Date(now.getTime() + env.VERIFICATION_TOKEN_TTL_MS)
  // TODO: Change email's domain when we get Postmark approval
  const email = VerificationTokenEmail.fromString('recipient@cponton.com')
  const purposeCreateAccount = VerificationTokenPurpose.createAccount()
  const purposeResetPassword = VerificationTokenPurpose.resetPassword()

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedConfigService = mock<ConfigService>()
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
    mockedResolver.resolve.mockReturnValue(runner.manager)

    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({
        VERIFICATION_TOKEN_TTL_MS: env.VERIFICATION_TOKEN_TTL_MS,
        VERIFICATION_TOKEN_LENGTH: env.VERIFICATION_TOKEN_LENGTH,
      }),
    )

    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    domainEventDatabaseHelper = new DomainEventDatabaseHelper(runner.manager)

    request = {
      email: email.toString(),
      purpose: purposeCreateAccount.toString(),
      sendNewToken: false,
      language: 'es',
    }

    currentVerificationToken = makeRawVerificationToken({
      id: VerificationTokenIdMother.valid().toString(),
      purpose: purposeCreateAccount.toString(),
      token_hash: VerificationTokenTokenHashMother.random().toString(),
      email: email.toString(),
      expires_at: futureExpiresAt,
      used_at: null,
      created_at: pastDate,
    })

    currentDomainEvent = makeRawDomainEvent({
      id: DomainEventIdMother.valid().toString(),
      metadata: {},
      aggregate_id: currentVerificationToken.id,
      aggregate_type: DomainEventAggregateType.verificationToken().toString(),
      name: DomainEventName.emailVerificationRequest().toString(),
      payload: {
        email: email.toString(),
        purpose: purposeCreateAccount.toString(),
        resendCode: false,
        lang: request.language,
      },
      occurred_at: pastDate,
    })
  })

  const buildUseCase = () => {
    return new GenerateVerificationToken(
      new PostgreSqlVerificationTokenRepository(mockedResolver),
      new PostgresqlUserRepository(mockedResolver),
      new PostgreSqlDomainEventRepository(mockedResolver),
      new PostmarkEmailSenderService(
        new ServerClient(env.EMAIL_API_TOKEN),
        env.EMAIL_FROM_ADDRESS,
        env.EMAIL_COMPANY_NAME,
        env.EMAIL_APP_NAME,
        new LoggerServiceMock(),
      ),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new TypeOrmUnitOfWork(global.dataSource),
      new NodeHasherService(env.HASH_SECRET),
      new ClockServiceMock(now),
      new NodeRandomService(),
      mockedConfigService,
      new LoggerServiceMock(),
      new NodeIdGeneratorService(),
    )
  }

  const findVerificationTokenInArray = (verificationTokens: Array<VerificationTokenRawModel>, email: string, purpose: string) => {
    return verificationTokens.find(
      (verificationToken) => verificationToken.purpose === purpose.toString() && verificationToken.email === email.toString(),
    )
  }

  const findDomainEventByAggregateIdInArray = (domainEvents: Array<DomainEventRawModel>, aggregateId: string) => {
    return domainEvents.find((domainEvent) => domainEvent.aggregate_id === aggregateId)
  }

  const runTestAndGetResults = async (request: GenerateVerificationTokenApplicationRequestDto) => {
    const useCase = buildUseCase()

    const verificationTokensBefore = await verificationTokenDatabaseHelper.findByEmailAndPurpose(
      email.toString(),
      purposeCreateAccount.toString(),
    )
    const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateType(
      DomainEventAggregateType.verificationToken().toString(),
    )

    const result = await useCase.execute(request)

    const verificationTokensAfter = await verificationTokenDatabaseHelper.findByEmailAndPurpose(
      email.toString(),
      purposeCreateAccount.toString(),
    )
    const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateType(
      DomainEventAggregateType.verificationToken().toString(),
    )

    return { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter }
  }

  describe('happy path', () => {
    const assertSavedDomainEventAndVerificationTokenToBeDefined = (
      verificationTokens: Array<VerificationTokenRawModel>,
      domainEvents: Array<DomainEventRawModel>,
    ) => {
      const savedVerificationToken = findVerificationTokenInArray(verificationTokens, email.toString(), purposeCreateAccount.toString())
      expect(savedVerificationToken).toBeDefined()

      const savedDomainEvent = findDomainEventByAggregateIdInArray(domainEvents, savedVerificationToken!.id)
      expect(savedDomainEvent).toBeDefined()

      return { savedVerificationToken: savedVerificationToken!, savedDomainEvent: savedDomainEvent! }
    }

    const assertSavedDomainEventAndVerificationToken = (
      domainEvent: DomainEventRawModel,
      verificationToken: VerificationTokenRawModel,
      resendCode: boolean,
    ) => {
      expect(domainEvent.aggregate_id).toEqual(verificationToken.id)
      expect(domainEvent.name).toEqual(DomainEventName.emailVerificationRequest().toString())
      expect(domainEvent.aggregate_type).toEqual(DomainEventAggregateType.verificationToken().toString())
      expect(domainEvent.payload).toEqual({
        email: email.toString(),
        purpose: purposeCreateAccount.toString(),
        resendCode,
        lang: request.language,
      })

      expect(verificationToken.email).toBe(email.toString())
      expect(verificationToken.purpose).toBe(purposeCreateAccount.toString())
      expect(verificationToken.expires_at.getTime()).toBe(expectedExpiresAt.getTime())
      expect(verificationToken.used_at).toBeNull()
    }

    it('should create a new verification token when an active token does not exist', async () => {
      const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
        await runTestAndGetResults(request)

      expect(result).toEqual({
        success: true,
        value: undefined,
      })

      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsBefore).toEqual([])
      expect(verificationTokensBefore.length).toBe(0)
      expect(verificationTokensBefore).toEqual([])

      expect(verificationTokensAfter.length).toBe(1)
      expect(domainEventsAfter.length).toBe(1)

      const { savedVerificationToken, savedDomainEvent } = assertSavedDomainEventAndVerificationTokenToBeDefined(
        verificationTokensAfter,
        domainEventsAfter,
      )

      assertSavedDomainEventAndVerificationToken(savedDomainEvent, savedVerificationToken, false)
    })

    describe('when an active token exists', () => {
      beforeEach(async () => {
        await verificationTokenDatabaseHelper.save(currentVerificationToken)
        await domainEventDatabaseHelper.save(currentDomainEvent)
      })

      const testCase = async (currentVerificationToken: VerificationTokenRawModel) => {
        const useCase = buildUseCase()

        const verificationTokensBefore = await verificationTokenDatabaseHelper.findByEmailAndPurpose(
          email.toString(),
          purposeCreateAccount.toString(),
        )
        const domainEventsBefore = await domainEventDatabaseHelper.findByAggregateType(
          DomainEventAggregateType.verificationToken().toString(),
        )

        const sendNewTokenRequest = { ...request, sendNewToken: true }

        const result = await useCase.execute(sendNewTokenRequest)

        const verificationTokensAfter = await verificationTokenDatabaseHelper.findByEmailAndPurpose(
          email.toString(),
          purposeCreateAccount.toString(),
        )
        const domainEventsAfter = await domainEventDatabaseHelper.findByAggregateType(
          DomainEventAggregateType.verificationToken().toString(),
        )

        expect(result).toEqual({
          success: true,
          value: undefined,
        })

        expect(domainEventsBefore.length).toBe(1)
        expect(domainEventsBefore).toEqual([currentDomainEvent])
        expect(verificationTokensBefore.length).toBe(1)
        expect(verificationTokensBefore).toEqual([currentVerificationToken])

        expect(verificationTokensAfter.length).toBe(1)
        expect(domainEventsAfter.length).toBe(2)

        const { savedVerificationToken, savedDomainEvent } = assertSavedDomainEventAndVerificationTokenToBeDefined(
          verificationTokensAfter,
          domainEventsAfter,
        )

        assertSavedDomainEventAndVerificationToken(savedDomainEvent, savedVerificationToken, true)
      }

      it('should create a new verification token when active token is usable and sendNewToken is true', async () => {
        await testCase(currentVerificationToken)
      })

      it('should create a new verification token when active token is not usable and sendNewToken is false', async () => {
        await verificationTokenDatabaseHelper.update(currentVerificationToken.id, { used_at: pastDate })

        const inactiveToken = { ...currentVerificationToken, used_at: pastDate }

        await testCase(inactiveToken)
      })
    })
  })

  describe('when there are errors', () => {
    let rawUser: UserRawModelWithRelations
    let userDatabaseHelper: UserDatabaseHelper

    beforeEach(() => {
      rawUser = makeRawUser({
        email: email.toString(),
        deleted_at: null,
        status: UserStatus.active().toString(),
      })

      userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    })

    it('should return error when purpose is createAccount and email is already taken', async () => {
      await userDatabaseHelper.save(rawUser)

      const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
        await runTestAndGetResults(request)

      expect(result).toEqual({
        success: false,
        error: GenerateVerificationTokenApplicationError.emailAlreadyTaken(email.toString()),
      })
      expect(verificationTokensBefore.length).toBe(0)
      expect(verificationTokensAfter.length).toBe(0)
      expect(domainEventsBefore.length).toBe(0)
      expect(domainEventsAfter.length).toBe(0)
    })

    describe('when purpose is resetPassword and user does not exist, is deleted or is not active', () => {
      const testCase = async () => {
        const { result, verificationTokensBefore, verificationTokensAfter, domainEventsBefore, domainEventsAfter } =
          await runTestAndGetResults({ ...request, purpose: purposeResetPassword.toString() })

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
        await userDatabaseHelper.save({ ...rawUser, status: UserStatus.deactivated().toString() })
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
        error: GenerateVerificationTokenApplicationError.activeTokenAlreadyIssued(email.toString(), purposeCreateAccount.toString()),
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
