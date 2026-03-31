import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'
import { ValidateVerificationToken } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationToken'
import { ValidateVerificationTokenApplicationRequestDto } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationRequestDto'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'
import { ClockServiceMock } from '~/src/test/utils/ClockServiceMock'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { ValidateVerificationTokenError } from '~/src/modules/Auth/Application/ValidateVerificationToken/ValidateVerificationTokenApplicationError'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

describe('ValidateVerificationToken', () => {
  const now = new Date('2025-10-31T10:50:00Z')
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const pastDate = new Date(now.getTime() - 3600 * 1000)

  const email = EmailAddressMother.random()
  const tokenPurpose = VerificationTokenPurpose.createAccount()
  const validTokenValue = VerificationTokenValueMother.random().value
  const wrongTokenValue = VerificationTokenValueMother.random().value

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const hasherService = new BCryptHasherService(env.SALT_ROUNDS)

  let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
  let runner: QueryRunner
  let validTokenHash: string
  let baseRequest: ValidateVerificationTokenApplicationRequestDto

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  beforeEach(async () => {
    mockReset(mockedResolver)
    mockedResolver.resolve.mockReturnValue(runner.manager)

    verificationTokenDatabaseHelper = new VerificationTokenDatabaseHelper(runner.manager)
    validTokenHash = await hasherService.hash(validTokenValue)

    baseRequest = {
      email: email.value,
      purpose: tokenPurpose.value,
      token: validTokenValue,
    }
  })

  const buildUseCase = () => {
    return new ValidateVerificationToken(
      new PostgreSqlVerificationTokenRepository(mockedResolver),
      new VerifyTokenService(hasherService),
      new ClockServiceMock(now),
      new LoggerServiceMock(),
    )
  }

  const createAndSaveToken = async (expiresAt: Date): Promise<void> => {
    const rawToken = makeRawVerificationToken({
      id: IdentifierMother.valid().value,
      email: email.value,
      purpose: tokenPurpose.value,
      token_hash: validTokenHash,
      expires_at: expiresAt,
      used_at: null,
      created_at: pastDate,
    })

    await verificationTokenDatabaseHelper.save(rawToken)
  }

  const runTestWithGuards = async (request: ValidateVerificationTokenApplicationRequestDto) => {
    const useCase = buildUseCase()

    const tokensBefore = await verificationTokenDatabaseHelper.findByEmail(request.email)

    const result = await useCase.execute(request)

    const tokensAfter = await verificationTokenDatabaseHelper.findByEmail(request.email)

    expect(tokensBefore.length).toEqual(tokensAfter.length)
    expect(tokensBefore).toEqual(tokensAfter)

    return result
  }

  describe('happy path', () => {
    it('should return success when token exists, is usable and code matches', async () => {
      await createAndSaveToken(futureDate)

      const result = await runTestWithGuards(baseRequest)

      expect(result).toEqual({ success: true, value: undefined })
    })
  })

  describe('when there are errors', () => {
    it('should return notFound error when token does not exist in database', async () => {
      const result = await runTestWithGuards(baseRequest)

      expect(result.success).toEqual(false)
      expect(result['error']).toStrictEqual(ValidateVerificationTokenError.notFound())
    })

    it('should return invalidToken error when token exists but code hash does not match', async () => {
      await createAndSaveToken(futureDate)

      const requestWithWrongTokenValue = { ...baseRequest, token: wrongTokenValue }

      const result = await runTestWithGuards(requestWithWrongTokenValue)

      expect(result.success).toEqual(false)
      expect(result['error']).toStrictEqual(ValidateVerificationTokenError.invalidToken())
    })

    it('should return expired error when token exists but is expired', async () => {
      await createAndSaveToken(pastDate)

      const result = await runTestWithGuards(baseRequest)

      const expectedDomainErrorMessage = VerificationTokenDomainException.alreadyExpired().message

      expect(result.success).toEqual(false)
      expect(result['error']).toStrictEqual(ValidateVerificationTokenError.expired(expectedDomainErrorMessage))
    })
  })
})
