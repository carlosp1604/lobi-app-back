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
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'

describe('PostgreSqlVerificationTokenRepository', () => {
  const verificationTokenId = VerificationTokenIdMother.valid()
  const verificationTokenPurpose = VerificationTokenPurpose.createAccount()
  const verificationTokenTokenHash = VerificationTokenTokenHashMother.valid()
  const email = VerificationTokenEmailMother.valid()
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

  let baseRawVerificationToken: VerificationTokenRawModel

  beforeEach(() => {
    baseRawVerificationToken = makeRawVerificationToken({
      id: verificationTokenId.toString(),
      purpose: verificationTokenPurpose.toString(),
      token_hash: verificationTokenTokenHash.toString(),
      email: email.toString(),
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

    const assertFoundVerificationToken = (
      foundVerificationToken: VerificationTokenRawModel | null,
      expectedVerificationToken: VerificationToken,
    ) => {
      expect(foundVerificationToken).not.toBeNull()
      expect(foundVerificationToken!.id).toBe(expectedVerificationToken.id.toString())
      expect(foundVerificationToken!.email).toBe(expectedVerificationToken.email.toString())
      expect(foundVerificationToken!.token_hash).toBe(expectedVerificationToken.tokenHash.toString())
      expect(foundVerificationToken!.purpose).toBe(expectedVerificationToken.purpose.toString())
      expect(foundVerificationToken!.expires_at.getTime()).toBe(expectedVerificationToken.expiresAt.getTime())
      expect(foundVerificationToken!.used_at).toEqual(expectedVerificationToken.usedAt)
    }

    it('should save verificationToken correctly', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const verificationToken = verificationTokenTestBuilder.build()

      await repository.save(verificationToken, context)

      const foundVerificationToken = await verificationTokenDatabaseHelper.findById(verificationTokenId.toString())

      assertFoundVerificationToken(foundVerificationToken, verificationToken)
      expect(foundVerificationToken!.used_at).toBeNull()
    })

    it('should update verificationToken correctly if it already exists', async () => {
      const { context, repository } = buildRepositoryAndContext(runner.manager)

      const initialCreatedAt = new Date(now.getTime() - 10000)
      const initialRawToken = makeRawVerificationToken({
        ...baseRawVerificationToken,
        created_at: initialCreatedAt,
      })
      await verificationTokenDatabaseHelper.save(initialRawToken)

      const updatedVerificationToken = verificationTokenTestBuilder.withUsedAt(now).build()

      await repository.save(updatedVerificationToken, context)

      const foundVerificationToken = await verificationTokenDatabaseHelper.findById(verificationTokenId.toString())

      assertFoundVerificationToken(foundVerificationToken, updatedVerificationToken)
      expect(foundVerificationToken!.used_at?.getTime()).toBe(now.getTime())
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

      const foundVerificationTokenBefore = await verificationTokenDatabaseHelper.findById(verificationTokenId.toString())

      await repository.delete(verificationTokenId.toString(), context)

      const foundVerificationTokenAfter = await verificationTokenDatabaseHelper.findById(verificationTokenId.toString())

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

      const result = await repository.findByEmailWithLock(email.toString(), context)

      expect(result).not.toBeNull()
      expect(result?.id.equals(verificationTokenId)).toBe(true)
      expect(result?.email.equals(email)).toBe(true)
      expect(result?.purpose.equals(verificationTokenPurpose)).toBe(true)
      expect(result?.tokenHash.equals(verificationTokenTokenHash)).toBe(true)
      expect(result?.expiresAt.getTime()).toBe(baseRawVerificationToken.expires_at.getTime())
      expect(result?.createdAt.getTime()).toBe(baseRawVerificationToken.created_at.getTime())
      expect(result?.usedAt).toEqual(baseRawVerificationToken.used_at)
    })

    it('should return null if verificationToken does not exist', async () => {
      const { repository, context } = buildRepositoryAndContext(runner.manager)

      const result = await repository.findByEmailWithLock(email.toString(), context)

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

          await repository.findByEmailWithLock(email.toString(), context)

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

          const updatedVerificationToken = await repository.findByEmailWithLock(email.toString(), context)

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
