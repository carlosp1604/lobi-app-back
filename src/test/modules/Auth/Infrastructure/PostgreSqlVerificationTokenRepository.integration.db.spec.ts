import { DataSource, EntityManager, QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { VerificationTokenDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenDatabaseHelper'
import {
  VerificationTokenEntity,
  VerificationTokenRawModel,
} from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { runPessimisticLockTest } from '~/src/test/utils/concurrencyHelper'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'

describe('PostgreSqlVerificationTokenRepository', () => {
  const verificationTokenId = VerificationTokenIdMother.valid()
  const verificationTokenPurpose = VerificationTokenPurpose.createAccount()
  const verificationTokenTokenHash = VerificationTokenTokenHashMother.valid()
  const email = EmailAddressMother.valid()
  const now = new Date('2025-10-30T19:59:00Z')
  const futureExpiresAt = new Date(now.getTime() + 15 * 60 * 1000)

  const buildVerificationTokenDatabaseHelper = (entityManager: EntityManager) => {
    return new VerificationTokenDatabaseHelper(entityManager)
  }

  const buildRepositoryAndContext = (entityManager: EntityManager) => {
    const context = new TypeOrmTxContext(entityManager)
    const repository = new PostgreSqlVerificationTokenRepository({ resolve: () => entityManager } as TypeOrmManagerResolver)

    return { repository, context }
  }

  const checkVerificationToken = (result: VerificationToken | null) => {
    expect(result).not.toBeNull()
    expect(result?.id.equals(verificationTokenId)).toBe(true)
    expect(result?.email.equals(email)).toBe(true)
    expect(result?.purpose.equals(verificationTokenPurpose)).toBe(true)
    expect(result?.tokenHash.equals(verificationTokenTokenHash)).toBe(true)
    expect(result?.expiresAt.getTime()).toBe(baseRawVerificationToken.expires_at.getTime())
    expect(result?.createdAt.getTime()).toBe(baseRawVerificationToken.created_at.getTime())
    expect(result?.usedAt).toEqual(baseRawVerificationToken.used_at)
  }

  const assertFoundVerificationToken = (
    foundVerificationToken: VerificationTokenRawModel | null,
    expectedVerificationToken: VerificationToken,
  ) => {
    expect(foundVerificationToken).not.toBeNull()
    expect(foundVerificationToken!.id).toBe(expectedVerificationToken.id.value)
    expect(foundVerificationToken!.email).toBe(expectedVerificationToken.email.value)
    expect(foundVerificationToken!.token_hash).toBe(expectedVerificationToken.tokenHash.value)
    expect(foundVerificationToken!.purpose).toBe(expectedVerificationToken.purpose.value)
    expect(foundVerificationToken!.expires_at.getTime()).toBe(expectedVerificationToken.expiresAt.getTime())
    expect(foundVerificationToken!.used_at).toEqual(expectedVerificationToken.usedAt)
  }

  let baseRawVerificationToken: VerificationTokenRawModel

  beforeEach(() => {
    baseRawVerificationToken = makeRawVerificationToken({
      id: verificationTokenId.value,
      purpose: verificationTokenPurpose.value,
      token_hash: verificationTokenTokenHash.value,
      email: email.value,
      expires_at: futureExpiresAt,
      used_at: null,
      created_at: now,
    })
  })

  describe('save', () => {
    let runner: QueryRunner
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
    let verificationTokenTestBuilder = new VerificationTokenTestBuilder()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(runner.manager)
      verificationTokenTestBuilder = new VerificationTokenTestBuilder()
        .withId(verificationTokenId)
        .withEmail(email)
        .withTokenHash(verificationTokenTokenHash)
        .withPurpose(verificationTokenPurpose)
        .withUsedAt(null)
        .withCreatedAt(now)
        .withExpiresAt(futureExpiresAt)
    })

    it('should save verificationToken correctly', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const verificationToken = verificationTokenTestBuilder.build()

      const totalTokensBefore = await verificationTokenDatabaseHelper.count()

      await repository.save(verificationToken, context)

      const totalTokensAfter = await verificationTokenDatabaseHelper.count()

      const foundVerificationToken = await verificationTokenDatabaseHelper.findById(verificationTokenId.value)

      expect(totalTokensBefore).toBe(0)
      expect(totalTokensAfter).toBe(1)
      assertFoundVerificationToken(foundVerificationToken, verificationToken)
      expect(foundVerificationToken!.used_at).toBeNull()
    })

    it('should throw error and not insert when verificationToken already exists', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const initialRawToken = makeRawVerificationToken({
        ...baseRawVerificationToken,
        id: verificationTokenId.value,
      })
      await verificationTokenDatabaseHelper.save(initialRawToken)

      const duplicateVerificationToken = verificationTokenTestBuilder.build()

      const totalTokensBefore = await verificationTokenDatabaseHelper.count()
      expect(totalTokensBefore).toBe(1)

      await expect(repository.save(duplicateVerificationToken, context)).rejects.toThrow()
    })
  })

  describe('update', () => {
    let runner: QueryRunner
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper
    let verificationTokenTestBuilder = new VerificationTokenTestBuilder()

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(runner.manager)
      verificationTokenTestBuilder = new VerificationTokenTestBuilder()
        .withId(verificationTokenId)
        .withEmail(email)
        .withTokenHash(verificationTokenTokenHash)
        .withPurpose(verificationTokenPurpose)
        .withUsedAt(null)
        .withCreatedAt(now)
        .withExpiresAt(futureExpiresAt)
    })

    it('should update an existing verificationToken correctly', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const initialRawToken = makeRawVerificationToken({
        ...baseRawVerificationToken,
        id: verificationTokenId.value,
        used_at: null,
      })

      await verificationTokenDatabaseHelper.save(initialRawToken)

      const updatedVerificationToken = verificationTokenTestBuilder.withUsedAt(now).build()

      const totalTokensBefore = await verificationTokenDatabaseHelper.count()

      await repository.update(updatedVerificationToken, context)

      const totalTokensAfter = await verificationTokenDatabaseHelper.count()

      const foundVerificationToken = await verificationTokenDatabaseHelper.findById(verificationTokenId.value)

      expect(totalTokensBefore).toBe(1)
      expect(totalTokensAfter).toBe(1)

      assertFoundVerificationToken(foundVerificationToken, updatedVerificationToken)
      expect(foundVerificationToken!.used_at?.getTime()).toBe(now.getTime())
    })

    it('should not affect other tokens when the token does not exist', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const existingTokenId = VerificationTokenIdMother.valid()
      const existingRawToken = makeRawVerificationToken({
        ...baseRawVerificationToken,
        id: existingTokenId.value,
        used_at: null,
      })
      await verificationTokenDatabaseHelper.save(existingRawToken)

      const ghostVerificationToken = verificationTokenTestBuilder.withUsedAt(now).build()

      const totalTokensBefore = await verificationTokenDatabaseHelper.count()

      await repository.update(ghostVerificationToken, context)

      const totalTokensAfter = await verificationTokenDatabaseHelper.count()

      expect(totalTokensBefore).toBe(1)
      expect(totalTokensAfter).toBe(1)

      const foundExistingToken = await verificationTokenDatabaseHelper.findById(existingTokenId.value)
      expect(foundExistingToken).not.toBeNull()
      expect(foundExistingToken!.used_at).toBeNull()

      const foundGhostToken = await verificationTokenDatabaseHelper.findById(ghostVerificationToken.id.value)
      expect(foundGhostToken).toBeNull()
    })
  })

  describe('delete', () => {
    let runner: QueryRunner
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(runner.manager)
    })

    it('should delete the verificationToken correctly when it exists', async () => {
      await verificationTokenDatabaseHelper.save(baseRawVerificationToken)

      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const foundVerificationTokenBefore = await verificationTokenDatabaseHelper.findById(verificationTokenId.value)

      await repository.delete(verificationTokenId.value, context)

      const foundVerificationTokenAfter = await verificationTokenDatabaseHelper.findById(verificationTokenId.value)

      expect(foundVerificationTokenBefore).not.toBeNull()
      expect(foundVerificationTokenAfter).toBeNull()
    })
  })

  describe('findByEmailWithLock', () => {
    let runner: QueryRunner
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(runner.manager)
    })

    it('should find verificationToken and translate to domain correctly', async () => {
      await verificationTokenDatabaseHelper.save(baseRawVerificationToken)

      const { repository, context } = buildRepositoryAndContext(runner.manager)

      const result = await repository.findByEmailWithLock(email.value, context)

      checkVerificationToken(result)
    })

    it('should return the most recent verificationToken when multiple tokens exist for the same email', async () => {
      const { repository, context } = buildRepositoryAndContext(runner.manager)

      const oldDate = new Date(now.getTime() - 10000)

      const oldTokenId = VerificationTokenIdMother.valid()
      await verificationTokenDatabaseHelper.save({
        ...baseRawVerificationToken,
        token_hash: VerificationTokenTokenHashMother.random().value,
        id: oldTokenId.value,
        created_at: oldDate,
        used_at: oldDate,
      })

      const recentTokenId = verificationTokenId
      await verificationTokenDatabaseHelper.save({
        ...baseRawVerificationToken,
        id: verificationTokenId.value,
        created_at: now,
        used_at: null,
      })

      const result = await repository.findByEmailWithLock(email.value, context)

      expect(result).not.toBeNull()
      expect(result?.id.equals(recentTokenId)).toBe(true)

      expect(result?.createdAt.getTime()).not.toBe(oldDate.getTime())
    })

    it('should return null when verificationToken does not exist', async () => {
      const { repository, context } = buildRepositoryAndContext(runner.manager)

      const result = await repository.findByEmailWithLock(email.value, context)

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    let runner: QueryRunner
    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(runner.manager)
    })

    it('should find verificationToken and translate to domain correctly', async () => {
      await verificationTokenDatabaseHelper.save(baseRawVerificationToken)

      const { repository } = buildRepositoryAndContext(runner.manager)

      const result = await repository.findByEmail(email.value)

      checkVerificationToken(result)
    })

    it('should return the most recent verificationToken when multiple tokens exist for the same email', async () => {
      const { repository } = buildRepositoryAndContext(runner.manager)

      const oldDate = new Date(now.getTime() - 10000)

      const oldTokenId = VerificationTokenIdMother.valid()
      await verificationTokenDatabaseHelper.save({
        ...baseRawVerificationToken,
        token_hash: VerificationTokenTokenHashMother.random().value,
        id: oldTokenId.value,
        created_at: oldDate,
        used_at: oldDate,
      })

      const recentTokenId = verificationTokenId
      await verificationTokenDatabaseHelper.save({
        ...baseRawVerificationToken,
        id: verificationTokenId.value,
        created_at: now,
        used_at: null,
      })

      const result = await repository.findByEmail(email.value)

      expect(result).not.toBeNull()
      expect(result?.id.equals(recentTokenId)).toBe(true)

      expect(result?.createdAt.getTime()).not.toBe(oldDate.getTime())
    })

    it('should return null when verificationToken does not exist', async () => {
      const { repository } = buildRepositoryAndContext(runner.manager)

      const result = await repository.findByEmail(email.value)

      expect(result).toBeNull()
    })
  })

  describe('concurrency', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    const updateNow = new Date()

    let verificationTokenDatabaseHelper: VerificationTokenDatabaseHelper

    beforeEach(() => {
      verificationTokenDatabaseHelper = buildVerificationTokenDatabaseHelper(dataSource.manager)
    })

    describe('findByEmailWithLock', () => {
      const setUpData = async () => {
        await verificationTokenDatabaseHelper.save(baseRawVerificationToken)
      }

      const cleanData = async () => {
        await verificationTokenDatabaseHelper.remove(baseRawVerificationToken)
      }

      it('should block a second transaction until first commit', async () => {
        const tx1Logic = async (runner: QueryRunner, signalAndWait: () => Promise<void>): Promise<void> => {
          const { repository, context } = buildRepositoryAndContext(runner.manager)

          await repository.findByEmailWithLock(email.value, context)

          await signalAndWait()

          // TODO: Mutate and save domain object retrieved using the repository
          // verificationToken.markAsUsed()
          const verificationTokenToSave: VerificationTokenRawModel = {
            ...baseRawVerificationToken,
            used_at: updateNow,
          }
          await runner.manager.getRepository(VerificationTokenEntity).save(verificationTokenToSave)

          await runner.commitTransaction()
        }

        const tx2Logic = async (runner: QueryRunner, gate: Promise<void>): Promise<VerificationToken | null> => {
          const { repository, context } = buildRepositoryAndContext(runner.manager)

          await gate

          const updatedVerificationToken = await repository.findByEmailWithLock(email.value, context)

          await runner.commitTransaction()
          return updatedVerificationToken
        }

        const [, updatedVerificationToken] = await runPessimisticLockTest<void, VerificationToken | null>({
          dataSource,
          setUpData,
          cleanData,
          tx1Logic,
          tx2Logic,
        })

        expect(updatedVerificationToken).not.toBeNull()
        expect(updatedVerificationToken?.usedAt?.getTime()).toBe(updateNow.getTime())
      })
    })
  })
})
