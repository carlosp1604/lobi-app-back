import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'

describe('PostgreSqlUserCredentialRepository', () => {
  const now = new Date('2025-09-26T14:11:25Z')

  let runner: QueryRunner

  withTransaction((r) => {
    runner = r
  })

  describe('saveLoginSuccess', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.valid()

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.toString(),
    })

    const updatedAt = new Date(now.getTime() + 500)

    const createUserCredential = (userCredentialUserId: UserId) => {
      return new UserCredentialTestBuilder()
        .withUserId(userCredentialUserId)
        .withFailedAttempts(0)
        .withLastLoginAt(updatedAt)
        .withLockedUntil(null)
        .withUpdatedAt(updatedAt)
        .build()
    }

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)

      const rawUser = makeRawUser({
        id: userId.toString(),
        email: userEmail.toString(),
      })
      await userRepository.save(rawUser)
    })

    it('should update entity correctly', async () => {
      const credentialRepository = runner.manager.getRepository(UserCredentialEntity)
      await credentialRepository.save(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const context = new TypeOrmTxContext(runner.manager)

      const userCredential = createUserCredential(userId)

      await repository.saveLoginSuccess(userCredential, context)

      const updatedRow = await credentialRepository.findOne({
        where: {
          user_id: rawUserCredential.user_id,
        },
      })

      expect(updatedRow?.failed_attempts).toBe(0)
      expect(updatedRow?.locked_until).toBeNull()
      expect(updatedRow?.last_login_at?.getTime()).toBe(updatedAt.getTime())
      expect(updatedRow?.updated_at.getTime()).toBe(updatedAt.getTime())
    })

    it('should not update entity if is not found', async () => {
      const credentialRepository = runner.manager.getRepository(UserCredentialEntity)
      await credentialRepository.save(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const context = new TypeOrmTxContext(runner.manager)

      const anotherUserId = UserIdMother.valid()
      const userCredential = createUserCredential(anotherUserId)

      await repository.saveLoginSuccess(userCredential, context)

      const originalRow = await credentialRepository.findOne({
        where: {
          user_id: rawUserCredential.user_id,
        },
      })

      const expectedToUpdateRow = await credentialRepository.findOne({
        where: {
          user_id: anotherUserId.toString(),
        },
      })

      expect(expectedToUpdateRow).toBeNull()
      expect(originalRow?.failed_attempts).toBe(rawUserCredential.failed_attempts)
      expect(originalRow?.locked_until?.getTime()).toBe(rawUserCredential.locked_until?.getTime())
      expect(originalRow?.last_login_at).toBe(rawUserCredential.last_login_at)
      expect(originalRow?.updated_at.getTime()).toBe(rawUserCredential.updated_at.getTime())
    })
  })

  describe('findByUserId', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.valid()
    const passwordHash = PasswordHashMother.valid()

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)

      const rawUser = makeRawUser({
        id: userId.toString(),
        email: userEmail.toString(),
        created_at: now,
        updated_at: now,
      })
      await userRepository.save(rawUser)
    })

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.toString(),
      updated_at: now,
      created_at: now,
      failed_attempts: 2,
      last_login_at: null,
      locked_until: null,
      password_hash: passwordHash.toString(),
    })

    const checkUserCredentialFound = (result: UserCredential | null) => {
      expect(result).toBeTruthy()
      expect(result?.userId.equals(userId)).toBe(true)
      expect(result?.passwordHash.equals(passwordHash)).toBe(true)
      expect(result?.updatedAt.getTime()).toBe(now.getTime())
      expect(result?.createdAt.getTime()).toBe(now.getTime())
      expect(result?.failedAttempts).toBe(2)
      expect(result?.lastLoginAt).toBe(null)
      expect(result?.lockedUntil).toBe(null)
    }

    it('should find user and translate to domain correctly', async () => {
      const userCredentialRepository = runner.manager.getRepository(UserCredentialEntity)
      await userCredentialRepository.save(rawUserCredential)

      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByUserId(userId.toString(), context)

      checkUserCredentialFound(result)
    })

    it('should return null if user does not exist', async () => {
      const context = new TypeOrmTxContext(runner.manager)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repository.findByUserId(userId.toString(), context)

      expect(result).toBeNull()
    })
  })
})
