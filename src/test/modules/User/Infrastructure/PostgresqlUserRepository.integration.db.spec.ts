import 'reflect-metadata'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { User } from '~/src/modules/User/Domain/User'
import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'

describe('PostgresqlUserRepository', () => {
  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.valid()
  const now = new Date('2025-09-26T14:11:25Z')

  const baseRawUser = makeRawUser({
    id: userId.toString(),
    email: userEmail.toString(),
    email_verified_at: now,
    created_at: now,
    updated_at: now,
  })

  const rawCredential = makeRawUserCredential({
    user_id: userId.toString(),
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    created_at: now,
    updated_at: now,
  })

  const checkUserFound = (result: User | null) => {
    expect(result).toBeTruthy()
    expect(result?.id.toString()).toBe(userId.toString())
    expect(() => result?.credential).not.toThrow()
  }

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })
  describe('findByEmailWithCredentials', () => {
    it('should find user with credential and translate to domain correctly', async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(baseRawUser)

      const credentialRepository = runner.manager.getRepository(UserCredentialEntity)
      await credentialRepository.save(rawCredential)

      const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repo.findByEmailWithCredentials(userEmail.toString())

      checkUserFound(result)
      expect(result?.credential?.userId.toString()).toBe(userId.toString())
    })

    it('should find user without credential and translate to domain correctly', async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      await userRepository.save(baseRawUser)

      const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repo.findByEmailWithCredentials(userEmail.toString())

      checkUserFound(result)
      expect(result?.credential).toBeNull()
    })

    it('should return null if user does not exist', async () => {
      const repo = new PostgresqlUserRepository({ resolve: () => runner.manager } as TypeOrmManagerResolver)

      const result = await repo.findByEmailWithCredentials(userEmail.toString())

      expect(result).toBeNull()
    })
  })
})
