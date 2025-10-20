import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { User } from '~/src/modules/User/Domain/User'
import { DataSource, QueryRunner } from 'typeorm'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { withTransaction } from '~/src/test/utils/withTransaction'

describe('PostgresqlUserRepository', () => {
  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.valid()
  const userName = UserNameMother.valid()
  const username = UserUsernameMother.random()
  const now = new Date('2025-09-26T14:11:25Z')

  let baseRawUser: UserRawModelWithRelations

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

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    it('should find user and translate to domain correctly', async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(baseRawUser)

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

    withTransaction((queryRunner) => {
      runner = queryRunner
    })

    it('should find user and translate to domain correctly', async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(baseRawUser)

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

  describe('findByEmailWithLock concurrency', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    it('should block a second transaction until first commit', async () => {
      const updateNow = new Date('2025-10-17T14:11:25Z')

      const userRepository = dataSource.manager.getRepository(UserEntity)
      await userRepository.save(baseRawUser)

      const runner1 = dataSource.createQueryRunner()
      const runner2 = dataSource.createQueryRunner()

      try {
        await Promise.all([runner1.connect(), runner2.connect()])
        await Promise.all([runner1.startTransaction(), runner2.startTransaction()])

        const repository1 = new PostgresqlUserRepository({ resolve: () => runner1.manager } as TypeOrmManagerResolver)
        const repository2 = new PostgresqlUserRepository({ resolve: () => runner2.manager } as TypeOrmManagerResolver)

        const transaction1 = async () => {
          await repository1.findByEmailWithLock(userEmail.toString(), new TypeOrmTxContext(runner1.manager))

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().toString(),
          }

          const userRepository = runner1.manager.getRepository(UserEntity)

          await userRepository.save(userToSave)

          await runner1.commitTransaction()
        }

        const transaction2 = async () => {
          const updatedUser = await repository2.findByEmailWithLock(userEmail.toString(), new TypeOrmTxContext(runner2.manager))

          await runner2.commitTransaction()

          return updatedUser
        }

        const [, updatedUser] = await Promise.all([transaction1(), transaction2()])

        expect(updatedUser).toBeTruthy()
        expect(updatedUser?.status.equals(UserStatus.deactivated())).toBe(true)
        expect(updatedUser?.updatedAt.getTime()).toBe(updateNow.getTime())
      } finally {
        await Promise.all([
          runner1.isTransactionActive && runner1.rollbackTransaction(),
          runner2.isTransactionActive && runner2.rollbackTransaction(),
        ])
        await Promise.all([runner1.release(), runner2.release()])

        await userRepository.remove(baseRawUser)
      }
    })
  })

  describe('findByIdWithLock concurrency', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    it('should block a second transaction until first commit', async () => {
      const updateNow = new Date('2025-10-17T14:11:25Z')

      const userRepository = dataSource.manager.getRepository(UserEntity)

      await userRepository.save(baseRawUser)

      const runner1 = dataSource.createQueryRunner()
      const runner2 = dataSource.createQueryRunner()

      try {
        await Promise.all([runner1.connect(), runner2.connect()])
        await Promise.all([runner1.startTransaction(), runner2.startTransaction()])

        const repository1 = new PostgresqlUserRepository({ resolve: () => runner1.manager } as TypeOrmManagerResolver)
        const repository2 = new PostgresqlUserRepository({ resolve: () => runner2.manager } as TypeOrmManagerResolver)

        const transaction1 = async () => {
          await repository1.findByIdWithLock(userId.toString(), new TypeOrmTxContext(runner1.manager))

          // TODO: Mutate and save domain object retrieved using the repository
          // user.deactivate()
          const userToSave: UserRawModelWithRelations = {
            ...baseRawUser,
            updated_at: updateNow,
            status: UserStatus.deactivated().toString(),
          }

          const userRepository = runner1.manager.getRepository(UserEntity)

          await userRepository.save(userToSave)

          await runner1.commitTransaction()
        }

        const transaction2 = async () => {
          const updatedUser = await repository2.findByIdWithLock(userId.toString(), new TypeOrmTxContext(runner2.manager))

          await runner2.commitTransaction()

          return updatedUser
        }

        const [, updatedUser] = await Promise.all([transaction1(), transaction2()])

        expect(updatedUser).toBeTruthy()
        expect(updatedUser?.status.equals(UserStatus.deactivated())).toBe(true)
        expect(updatedUser?.updatedAt.getTime()).toBe(updateNow.getTime())
      } finally {
        await Promise.all([
          runner1.isTransactionActive && runner1.rollbackTransaction(),
          runner2.isTransactionActive && runner2.rollbackTransaction(),
        ])
        await Promise.all([runner1.release(), runner2.release()])

        await userRepository.remove(baseRawUser)
      }
    })
  })
})
