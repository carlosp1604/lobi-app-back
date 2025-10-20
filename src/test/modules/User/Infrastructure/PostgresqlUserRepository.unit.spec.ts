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

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('findByEmailWithLock', () => {
    const context: TxContext = { __opaque_tx_context: true }
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.random()

    const mockedQueryBuilder = mock<SelectQueryBuilder<UserRawModelWithRelations>>()

    const rawUser = makeRawUser({
      id: userId.toString(),
      email: userEmail.toString(),
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })

    const expectedUser = new UserTestBuilder().withId(userId).build()

    describe('happy path', () => {
      beforeEach(() => {
        mockReset(mockedResolver)
        mockReset(mockedEntityManager)
        mockReset(mockedQueryBuilder)

        mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
        mockedEntityManager.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.where.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.setLock.mockReturnValueOnce(mockedQueryBuilder)
      })

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
        mockedQueryBuilder.getOne.mockResolvedValueOnce(rawUser)
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

        await repository.findByEmailWithLock('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
      })

      it('should call services correctly when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValueOnce(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByEmailWithLock('user@example.com', context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValueOnce(rawUser)

        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

        const result = await repository.findByEmailWithLock('user@example.com', context)

        expect(result).toBe(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValueOnce(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByEmailWithLock('user@example.com', context)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      beforeEach(() => {
        mockReset(mockedResolver)
        mockReset(mockedEntityManager)
        mockReset(mockedQueryBuilder)
      })

      it('should throw error if resolver fails', async () => {
        mockedResolver.resolve.mockImplementationOnce(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if ORM/Database fails', async () => {
        mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
        mockedEntityManager.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.where.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.setLock.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.getOne.mockImplementationOnce(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if translator fails', async () => {
        mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
        mockedEntityManager.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.where.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.setLock.mockReturnValueOnce(mockedQueryBuilder)
        mockedQueryBuilder.getOne.mockResolvedValueOnce(rawUser)

        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementationOnce(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithLock('user@example.com', context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })
})
