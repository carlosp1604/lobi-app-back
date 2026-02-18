import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserCredentialDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserCredentialDatabaseHelper'
import { UserDatabaseHelper } from '~/src/test/modules/Auth/Infrastructure/UserDatabaseHelper'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

describe('PostgreSqlUserCredentialRepository', () => {
  const now = new Date('2025-09-26T14:11:25Z')

  let runner: QueryRunner
  let userDatabaseHelper: UserDatabaseHelper
  let userCredentialDatabaseHelper: UserCredentialDatabaseHelper

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  beforeEach(() => {
    userDatabaseHelper = new UserDatabaseHelper(runner.manager)
    userCredentialDatabaseHelper = new UserCredentialDatabaseHelper(runner.manager)
  })

  describe('save', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.valid()

    beforeEach(async () => {
      const rawUser = makeRawUser({ id: userId.value, email: userEmail.value })
      await userDatabaseHelper.save(rawUser)
    })

    it('should save user credential correctly', async () => {
      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)
      const userCredential = new UserCredentialTestBuilder().withUserId(userId).build()

      const userCredentialsCountBefore = await userCredentialDatabaseHelper.count()

      await repository.save(userCredential, context)

      const userCredentialsCountAfter = await userCredentialDatabaseHelper.count()

      expect(userCredentialsCountBefore).toBe(0)
      expect(userCredentialsCountAfter).toBe(1)

      const savedRow = await userCredentialDatabaseHelper.findUserCredential(userId.value)

      expect(savedRow).not.toBeNull()
      expect(savedRow!.user_id).toBe(userCredential.userId.value)
      expect(savedRow!.password_hash).toBe(userCredential.passwordHash.value)
      expect(savedRow!.failed_attempts).toBe(userCredential.failedAttempts)
      expect(savedRow!.locked_until).toEqual(userCredential.lockedUntil)
      expect(savedRow!.last_login_at).toEqual(userCredential.lastLoginAt)
    })

    it('should throw error and not insert if credential already exists', async () => {
      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)

      const rawUserCredential = makeRawUserCredential({ user_id: userId.value })
      await userCredentialDatabaseHelper.save(rawUserCredential)

      const duplicateUserCredential = new UserCredentialTestBuilder().withUserId(userId).build()

      const userCredentialsCountBefore = await userCredentialDatabaseHelper.count()
      expect(userCredentialsCountBefore).toBe(1)

      await expect(repository.save(duplicateUserCredential, context)).rejects.toThrow()
    })
  })

  describe('update', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.valid()

    const initialPasswordHash = PasswordHashMother.valid()
    const newPasswordHash = PasswordHashMother.other()

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.value,
      password_hash: initialPasswordHash.value,
    })

    const updatedAt = new Date(now.getTime() + 500)

    const createUserCredential = (userCredentialUserId: UserId, passwordHash: PasswordHash) => {
      return new UserCredentialTestBuilder()
        .withUserId(userCredentialUserId)
        .withPasswordHash(passwordHash)
        .withFailedAttempts(0)
        .withLastLoginAt(updatedAt)
        .withLockedUntil(null)
        .withUpdatedAt(updatedAt)
        .build()
    }

    beforeEach(async () => {
      const rawUser = makeRawUser({
        id: userId.value,
        email: userEmail.value,
      })
      await userDatabaseHelper.save(rawUser)
    })

    it('should update entity correctly including password hash', async () => {
      await userCredentialDatabaseHelper.save(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)

      const userCredential = createUserCredential(userId, newPasswordHash)

      const userCredentialsCountBefore = await userCredentialDatabaseHelper.count()

      await repository.update(userCredential, context)

      const userCredentialsCountAfter = await userCredentialDatabaseHelper.count()
      const updatedRow = await userCredentialDatabaseHelper.findUserCredential(rawUserCredential.user_id)

      expect(userCredentialsCountBefore).toBe(1)
      expect(userCredentialsCountAfter).toBe(1)

      expect(updatedRow).not.toBeNull()
      expect(updatedRow!.failed_attempts).toBe(0)
      expect(updatedRow!.locked_until).toBeNull()
      expect(updatedRow!.last_login_at?.getTime()).toBe(updatedAt.getTime())
      expect(updatedRow!.updated_at.getTime()).toBe(updatedAt.getTime())
      expect(updatedRow!.password_hash).toBe(newPasswordHash.value)
      expect(updatedRow!.password_hash).not.toBe(initialPasswordHash.value)
    })

    it('should not update entity when it is not found', async () => {
      await userCredentialDatabaseHelper.save(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)

      const anotherUserId = UserIdMother.valid()
      const userCredential = createUserCredential(anotherUserId, newPasswordHash)

      const userCredentialsCountBefore = await userCredentialDatabaseHelper.count()

      await repository.update(userCredential, context)

      const userCredentialsCountAfter = await userCredentialDatabaseHelper.count()

      const originalRow = await userCredentialDatabaseHelper.findUserCredential(rawUserCredential.user_id)
      const expectedToUpdateRow = await userCredentialDatabaseHelper.findUserCredential(anotherUserId.value)

      expect(userCredentialsCountBefore).toBe(1)
      expect(userCredentialsCountAfter).toBe(1)

      expect(expectedToUpdateRow).toBeNull()

      expect(originalRow).not.toBeNull()
      expect(originalRow!.password_hash).toBe(initialPasswordHash.value)
      expect(originalRow!.failed_attempts).toBe(rawUserCredential.failed_attempts)
      expect(originalRow!.locked_until?.getTime()).toBe(rawUserCredential.locked_until?.getTime())
      expect(originalRow!.last_login_at).toBe(rawUserCredential.last_login_at)
      expect(originalRow!.updated_at.getTime()).toBe(rawUserCredential.updated_at.getTime())
    })
  })

  describe('findByUserId', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.valid()
    const passwordHash = PasswordHashMother.valid()

    beforeEach(async () => {
      const rawUser = makeRawUser({
        id: userId.value,
        email: userEmail.value,
        created_at: now,
        updated_at: now,
      })
      await userDatabaseHelper.save(rawUser)
    })

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.value,
      updated_at: now,
      created_at: now,
      failed_attempts: 2,
      last_login_at: null,
      locked_until: null,
      password_hash: passwordHash.value,
    })

    const checkUserCredentialFound = (result: UserCredential | null) => {
      expect(result).not.toBeNull()
      expect(result!.userId.equals(userId)).toBe(true)
      expect(result!.passwordHash.equals(passwordHash)).toBe(true)
      expect(result!.updatedAt.getTime()).toBe(now.getTime())
      expect(result!.createdAt.getTime()).toBe(now.getTime())
      expect(result!.failedAttempts).toBe(2)
      expect(result!.lastLoginAt).toBe(null)
      expect(result!.lockedUntil).toBe(null)
    }

    it('should find user and translate to domain correctly', async () => {
      await userCredentialDatabaseHelper.save(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)

      const result = await repository.findByUserId(userId.value, context)

      checkUserCredentialFound(result)
    })

    it('should return null when user does not exist', async () => {
      const repository = new PostgreSqlUserCredentialRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)
      const context = new TypeOrmTxContext(runner.manager)

      const result = await repository.findByUserId(userId.value, context)

      expect(result).toBeNull()
    })
  })
})
