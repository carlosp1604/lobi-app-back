/* eslint @typescript-eslint/unbound-method: 0 */
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { EntityManager, Repository } from 'typeorm'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'

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

  describe('findByEmailWithCredentials', () => {
    const userId = UserIdMother.valid()
    const userEmail = UserEmailMother.random()

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
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

        await repository.findByEmailWithCredentials('user@example.com')

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser, ['credential'])
      })

      it('should call services correctly when user is not found', async () => {
        mockedUserRepository.findOne.mockResolvedValueOnce(null)
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByEmailWithCredentials('user@example.com')

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        mockedUserRepository.findOne.mockResolvedValueOnce(rawUser as any)
        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValueOnce(expectedUser)

        const result = await repository.findByEmailWithCredentials('user@example.com')

        expect(result).toBe(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedUserRepository.findOne.mockResolvedValueOnce(null)
        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByEmailWithCredentials('user@example.com')

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

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithCredentials('user@example.com')).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error if translator fails', async () => {
        mockedUserRepository.findOne.mockResolvedValueOnce(rawUser as any)

        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementationOnce(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmailWithCredentials('user@example.com')).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })
})
