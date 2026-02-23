import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
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
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { mock, mockReset } from 'jest-mock-extended'

describe('PostgresqlUserRepository', () => {
  const userId = UserIdMother.valid()
  const userEmail = EmailAddressMother.valid()
  const userName = UserNameMother.valid()
  const username = UserUsernameMother.random()
  const now = new Date('2025-09-26T14:11:25Z')

  let baseRawUser: UserRawModelWithRelations

  const buildUserDatabaseHelper = (entityManager: EntityManager) => {
    return new UserDatabaseHelper(entityManager)
  }

  beforeEach(() => {
    baseRawUser = makeRawUser({
      id: userId.value,
      email: userEmail.value,
      status: UserStatus.active().value,
      username: username.value,
      role: UserRole.sportsman().value,
      name: userName.value,
      user_upload_id: null,
      deleted_at: null,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
  })

  const checkUserFound = (result: User | null) => {
    expect(result).not.toBeNull()
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
      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmailWithLock(userEmail.value, context)

      checkUserFound(result)
    })

    it('should return null when user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmailWithLock(userEmail.value, context)

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmail(userEmail.value, context)

      checkUserFound(result)
    })

    it('should return null when user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByEmail(userEmail.value, context)

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
      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)
    })

    it('should find user and translate to domain correctly', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByIdWithLock(userId.value, context)

      checkUserFound(result)
    })

    it('should return null when user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByIdWithLock(userId.value, context)

      expect(result).toBeNull()
    })
  })

  describe('checkEmailExists', () => {
    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)
    })

    it('should return true when a user with the email already exists', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)
      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.checkEmailExists(userEmail, context)

      expect(result).toBe(true)
    })

    it('should return false when no user with the email exists', async () => {
      const nonExistentEmail = EmailAddressMother.random()

      const context = new TypeOrmTxContext(runner.manager)
      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.checkEmailExists(nonExistentEmail, context)

      expect(result).toBe(false)
    })
  })

  describe('checkUsernameExists', () => {
    let runner: QueryRunner
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    beforeEach(() => {
      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)
    })

    it('should return true when a user with the username already exists', async () => {
      await userDatabaseHelper.save(baseRawUser)

      const context = new TypeOrmTxContext(runner.manager)
      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.checkUsernameExists(username, context)

      expect(result).toBe(true)
    })

    it('should return false when no user with the username exists', async () => {
      const nonExistentUsername = UserUsernameMother.random()

      const context = new TypeOrmTxContext(runner.manager)
      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.checkUsernameExists(nonExistentUsername, context)

      expect(result).toBe(false)
    })
  })

  describe('save', () => {
    let runner: QueryRunner
    let userTestBuilder: UserTestBuilder
    let userDatabaseHelper: UserDatabaseHelper

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    const mockedResolver = mock<TypeOrmManagerResolver>()

    beforeEach(() => {
      mockReset(mockedResolver)

      userDatabaseHelper = buildUserDatabaseHelper(runner.manager)

      userTestBuilder = new UserTestBuilder()
        .withId(userId)
        .withEmail(userEmail)
        .withUsername(username)
        .withName(userName)
        .withCreatedAt(now)
        .withUpdatedAt(now)

      mockedResolver.resolve.mockReturnValueOnce(runner.manager)
    })

    it('should save user correctly', async () => {
      const repository = new PostgresqlUserRepository(mockedResolver)

      const user = userTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      await repository.save(user, context)

      const userRepository = runner.manager.getRepository(UserEntity)

      const foundUser = await userRepository.findOneBy({
        id: userId.value,
      })

      expect(foundUser?.id).toBe(user.id.value)
      expect(foundUser?.email).toBe(user.email.value)
      expect(foundUser?.username).toBe(user.username.value)
      expect(foundUser?.name).toBe(user.name.value)
      expect(foundUser?.status).toBe(user.status.value)
      expect(foundUser?.role).toBe(user.role.value)
      expect(foundUser?.user_upload_id).toBe(user.userUploadId?.value ?? null)
      expect(foundUser?.created_at.getTime()).toBe(user.createdAt.getTime())
      expect(foundUser?.updated_at.getTime()).toBe(user.updatedAt.getTime())
    })

    it('should throw error when user already exists', async () => {
      const repository = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      await userDatabaseHelper.save(baseRawUser)

      const user = userTestBuilder.build()
      const context = new TypeOrmTxContext(runner.manager)

      await expect(repository.save(user, context)).rejects.toThrow()
    })
  })

  describe('concurrency', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    const updateNow = new Date()

    let userDatabaseHelper: UserDatabaseHelper

    beforeEach(() => {
      userDatabaseHelper = buildUserDatabaseHelper(dataSource.manager)
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

        expect(updatedUser).not.toBeNull()
        expect(updatedUser?.status.equals(UserStatus.deactivated())).toBe(true)
        expect(updatedUser?.updatedAt.getTime()).toBe(updateNow.getTime())
      }

      it('should block a second transaction until first commit (findByEmailWithLock)', async () => {
        const tx1Logic = async (runner: QueryRunner, signalAndWait: () => Promise<void>): Promise<void> => {
          const repository1 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx1 = new TypeOrmTxContext(runner.manager)

          await repository1.findByEmailWithLock(userEmail.value, ctx1)

          await signalAndWait()

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().value,
          }
          await runner.manager.getRepository(UserEntity).save(userToSave)

          await runner.commitTransaction()
        }

        const tx2Logic = async (runner: QueryRunner, gate: Promise<void>): Promise<User | null> => {
          const repository2 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx2 = new TypeOrmTxContext(runner.manager)

          await gate

          const updatedUser = await repository2.findByEmailWithLock(userEmail.value, ctx2)

          await runner.commitTransaction()
          return updatedUser
        }

        await runTestAndAssertResult(tx1Logic, tx2Logic)
      })

      it('should block a second transaction until first commit (findByIdWithLock)', async () => {
        const tx1Logic = async (runner: QueryRunner, signalAndWait: () => Promise<void>): Promise<void> => {
          const repository1 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx1 = new TypeOrmTxContext(runner.manager)

          await repository1.findByIdWithLock(userId.value, ctx1)

          await signalAndWait()

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().value,
          }
          await runner.manager.getRepository(UserEntity).save(userToSave)

          await runner.commitTransaction()
        }

        const tx2Logic = async (runner: QueryRunner, gate: Promise<void>): Promise<User | null> => {
          const repository2 = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
          const ctx2 = new TypeOrmTxContext(runner.manager)

          await gate

          const updatedUser = await repository2.findByIdWithLock(userId.value, ctx2)

          await runner.commitTransaction()
          return updatedUser
        }

        await runTestAndAssertResult(tx1Logic, tx2Logic)
      })
    })
  })
})
