import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { User } from '~/src/modules/User/Domain/User'
import { DataSource, EntityManager, QueryRunner } from 'typeorm'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { runPessimisticLockTest, Tx1Logic, Tx2Logic } from '~/src/test/utils/concurrencyHelper'

describe('PostgresqlUserRepository', () => {
  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.valid()
  const userName = UserNameMother.valid()
  const username = UserUsernameMother.random()
  const now = new Date('2025-09-26T14:11:25Z')

  let baseRawUser: UserRawModelWithRelations

  const buildUserDabataseHelper = (entityManager: EntityManager) => {
    return new UserDatabaseHelper(entityManager)
  }

  beforeEach(() => {
    baseRawUser = makeRawUser({
      id: userId.toString(),
      email: userEmail.toString(),
      status: UserStatus.active().toString(),
      username: username.toString(),
      role: UserRole.sportsman().toString(),
      name: userName.toString(),
      user_upload_id: null,
      deleted_at: null,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
  })

  const checkUserFound = (result: User | null) => {
    expect(result).toBeTruthy()
    expect(result?.id.equals(userId)).toBe(true)
    expect(result?.email.equals(userEmail)).toBe(true)
    expect(result?.status.equals(UserStatus.active())).toBe(true)
    expect(result?.role.equals(UserRole.sportsman())).toBe(true)
    expect(result?.username.equals(username)).toBe(true)
    expect(result?.name.equals(userName)).toBe(true)
    expect(result?.userUploadId).toBe(null)
    expect(result?.deletedAt).toBe(null)
    expect(result?.createdAt.getTime()).toBe(now.getTime())
    expect(result?.updatedAt.getTime()).toBe(now.getTime())
    expect(result?.emailVerifiedAt.getTime()).toBe(now.getTime())
  }

  describe('findByEmailWithLock', () => {
    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      userDatabaseHelper = buildUserDabataseHelper(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmailWithLock(userEmail.toString(), context)

      checkUserFound(result)
    })

    it('should return null if user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmailWithLock(userEmail.toString(), context)

      expect(result).toBeNull()
    })
  })

  describe('findByIdWithLock', () => {
    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      userDatabaseHelper = buildUserDabataseHelper(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByIdWithLock(userId.toString(), context)

      checkUserFound(result)
    })

    it('should return null if user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByIdWithLock(userId.toString(), context)

      expect(result).toBeNull()
    })
  })

  describe('concurrency', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    const updateNow = new Date()

    let userDatabaseHelper: UserDatabaseHelper

    beforeEach(() => {
      userDatabaseHelper = buildUserDabataseHelper(dataSource.manager)
    })

    describe('find user with lock', () => {
      const setUpData = async () => {
        await userDatabaseHelper.save(baseRawUser)
      }

      const cleanData = async () => {
        await userDatabaseHelper.remove(baseRawUser)
      }

      const runTestAndAssertResult = async (tx1Logic: Tx1Logic<void>, tx2Logic: Tx2Logic<User | null>) => {
        const [, updatedUser] = await runPessimisticLockTest<void, User | null>({
          dataSource,
          setUpData,
          cleanData,
          tx1Logic,
          tx2Logic,
        })

        expect(updatedUser).toBeTruthy()
        expect(updatedUser?.status.equals(UserStatus.deactivated())).toBe(true)
        expect(updatedUser?.updatedAt.getTime()).toBe(updateNow.getTime())
      }

      it('should block a second transaction until first commit (findByEmailWithLock)', async () => {
        const tx1Logic = async (runner: QueryRunner, tx1HasAcquiredLockResolver: () => void): Promise<void> => {
          const repository1 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx1 = new TypeOrmTxContext(runner.manager)

          await repository1.findByEmailWithLock(userEmail.toString(), ctx1)

          tx1HasAcquiredLockResolver()

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().toString(),
          }
          await runner.manager.getRepository(UserEntity).save(userToSave)

          await runner.commitTransaction()
        }

        const tx2Logic = async (runner: QueryRunner, gate: Promise<void>): Promise<User | null> => {
          const repository2 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx2 = new TypeOrmTxContext(runner.manager)

          await gate

          const updatedUser = await repository2.findByEmailWithLock(userEmail.toString(), ctx2)

          await runner.commitTransaction()
          return updatedUser
        }

        await runTestAndAssertResult(tx1Logic, tx2Logic)
      })

      it('should block a second transaction until first commit (findByIdWithLock)', async () => {
        const tx1Logic = async (runner: QueryRunner, tx1HasAcquiredLockResolver: () => void): Promise<void> => {
          const repository1 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx1 = new TypeOrmTxContext(runner.manager)

          await repository1.findByIdWithLock(userId.toString(), ctx1)

          tx1HasAcquiredLockResolver()

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().toString(),
          }
          await runner.manager.getRepository(UserEntity).save(userToSave)

          await runner.commitTransaction()
        }

        const tx2Logic = async (runner: QueryRunner, gate: Promise<void>): Promise<User | null> => {
          const repository2 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx2 = new TypeOrmTxContext(runner.manager)

          await gate

          const updatedUser = await repository2.findByIdWithLock(userId.toString(), ctx2)

          await runner.commitTransaction()
          return updatedUser
        }

        await runTestAndAssertResult(tx1Logic, tx2Logic)
      })
    })
  })
})
