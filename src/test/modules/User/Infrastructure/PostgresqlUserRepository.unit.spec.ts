/* eslint @typescript-eslint/unbound-method: 0 */
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

describe('PostgresqlUserRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserRepository = mock<Repository<typeof UserEntity>>()
  const mockedEntityManager = mock<EntityManager>({})
  const now = new Date('2025-09-26T14:11:25Z')

  const userId = UserIdMother.valid()
  const userEmail = UserEmailMother.random()

  let rawUser: UserRawModelWithRelations

  beforeEach(() => {
    rawUser = makeRawUser({
      id: userId.toString(),
      email: userEmail.toString(),
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
  })

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('findByEmailWithLock', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const mockedQueryBuilder = mock<SelectQueryBuilder<UserRawModelWithRelations>>()

    const expectedUser = new UserTestBuilder().withId(userId).build()

    beforeEach(() => {
      mockReset(mockedResolver)
      mockReset(mockedEntityManager)
      mockReset(mockedQueryBuilder)

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.createQueryBuilder.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.where.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.setLock.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.getOne.mockResolvedValue(rawUser)
    })

    describe('happy path', () => {
      const checkCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledWith(UserEntity, 'user')
        expect(mockedQueryBuilder.where).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.where).toHaveBeenCalledWith('user.email = :email', { email: 'user@example.com' })
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
        expect(mockedQueryBuilder.getOne).toHaveBeenCalledTimes(1)
      }

      it('should call services correctly when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        await repository.findByEmailWithLock('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
      })

      it('should call services correctly when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByEmailWithLock('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        const result = await repository.findByEmailWithLock('user@example.com', context)

        expect(result).toBe(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByEmailWithLock('user@example.com', context)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error if resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if ORM/Database fails', async () => {
        mockedQueryBuilder.getOne.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if translator fails', async () => {
        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })

  describe('findByEmail', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const mockedUserRepository = mock<Repository<UserRawModelWithRelations>>()

    const expectedUser = new UserTestBuilder().withId(userId).build()

    beforeEach(() => {
      mockReset(mockedResolver)
      mockReset(mockedEntityManager)
      mockReset(mockedUserRepository)

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserRepository)
      mockedUserRepository.findOneBy.mockResolvedValue(rawUser)
    })

    describe('happy path', () => {
      const checkCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserEntity)
        expect(mockedUserRepository.findOneBy).toHaveBeenCalledTimes(1)
        expect(mockedUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'user@example.com' })
      }

      it('should call services correctly when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        await repository.findByEmail('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
      })

      it('should call services correctly when user is not found', async () => {
        mockedUserRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByEmail('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        const result = await repository.findByEmail('user@example.com', context)

        expect(result).toBe(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedUserRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByEmail('user@example.com', context)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error if resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if ORM/Database fails', async () => {
        mockedUserRepository.findOneBy.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if translator fails', async () => {
        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail('user@example.com', context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })

  describe('findByIdWithLock', () => {
    const context: TxContext = { __opaque_tx_context: true }
    const userId = UserIdMother.valid()

    const mockedQueryBuilder = mock<SelectQueryBuilder<UserRawModelWithRelations>>()

    const rawUser = makeRawUser({
      id: userId.toString(),
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })

    const expectedUser = new UserTestBuilder().withId(userId).build()

    beforeEach(() => {
      mockReset(mockedResolver)
      mockReset(mockedEntityManager)
      mockReset(mockedQueryBuilder)

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.createQueryBuilder.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.where.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.setLock.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.getOne.mockResolvedValue(rawUser)
    })

    describe('happy path', () => {
      const checkCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledWith(UserEntity, 'user')
        expect(mockedQueryBuilder.where).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.where).toHaveBeenCalledWith('user.id = :id', { id: userId.toString() })
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
        expect(mockedQueryBuilder.getOne).toHaveBeenCalledTimes(1)
      }

      it('should call services correctly when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        await repository.findByIdWithLock(userId.toString(), context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
      })

      it('should call services correctly when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByIdWithLock(userId.toString(), context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        const result = await repository.findByIdWithLock(userId.toString(), context)

        expect(result).toBe(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByIdWithLock(userId.toString(), context)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error if resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByIdWithLock(userId.toString(), context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if ORM/Database fails', async () => {
        mockedQueryBuilder.getOne.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByIdWithLock(userId.toString(), context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if translator fails', async () => {
        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByIdWithLock(userId.toString(), context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })
})
