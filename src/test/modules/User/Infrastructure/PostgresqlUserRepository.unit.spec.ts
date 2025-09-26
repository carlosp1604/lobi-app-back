/* eslint @typescript-eslint/unbound-method: 0 */
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { EntityManager, Repository } from 'typeorm'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/User.entity'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'

describe('PostgresqlUserRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserRepository = mock<Repository<typeof UserEntity>>()
  const mockedEntityManager = mock<EntityManager>({})
  const now = new Date('2025-09-26T14:11:25Z')

  const userId = UserIdMother.valid().toString()

  const rawUser: UserRawModelWithRelations = {
    id: userId,
    email: UserEmailMother.valid().toString(),
    username: UserUsernameMother.valid().toString(),
    name: UserNameMother.valid().toString(),
    status: UserStatus.active().toString(),
    role: UserRole.sportsman().toString(),
    user_upload_id: UserUploadIdMother.valid().toString(),
    email_verified_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }

  const expectedUser = new UserTestBuilder().withId(UserId.fromString(userId)).build()

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserRepository)
    })

    const checkCommonCalls = () => {
      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith()
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserEntity)
      expect(mockedUserRepository.findOne).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        relations: ['credential'],
      })
    }

    it('should call services correctly when user is found', async () => {
      mockedUserRepository.findOne.mockResolvedValueOnce(rawUser as any)
      const repo = new PostgresqlUserRepository(mockedResolver)

      const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

      await repo.findByEmailWithCredentials('user@example.com')

      checkCommonCalls()

      expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser, ['credential'])
    })

    it('should call services correctly when user is not found', async () => {
      mockedUserRepository.findOne.mockResolvedValueOnce(null)
      const repo = new PostgresqlUserRepository(mockedResolver)

      const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

      await repo.findByEmailWithCredentials('user@example.com')

      checkCommonCalls()

      expect(userModelTranslatorSpy).not.toHaveBeenCalled()
    })

    it('should return the correct data when user is found', async () => {
      mockedUserRepository.findOne.mockResolvedValueOnce(rawUser as any)
      const repo = new PostgresqlUserRepository(mockedResolver)

      jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

      const result = await repo.findByEmailWithCredentials('user@example.com')

      expect(result).toBe(expectedUser)
    })

    it('should return NULL when user is not found', async () => {
      mockedUserRepository.findOne.mockResolvedValueOnce(null)
      const repo = new PostgresqlUserRepository(mockedResolver)

      const result = await repo.findByEmailWithCredentials('user@example.com')

      expect(result).toBeNull()
    })
  })

  describe('when there are errors', () => {
    beforeEach(() => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserRepository)
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedUserRepository.findOne.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repo = new PostgresqlUserRepository(mockedResolver)

      await expect(repo.findByEmailWithCredentials('user@example.com')).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedUserRepository.findOne.mockResolvedValueOnce(rawUser as any)

      jest.spyOn(UserModelTranslator, 'toDomain').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to domain')
      })

      const repo = new PostgresqlUserRepository(mockedResolver)

      await expect(repo.findByEmailWithCredentials('user@example.com')).rejects.toThrow(
        Error('Something went wrong while translating entity to domain'),
      )
    })
  })
})
