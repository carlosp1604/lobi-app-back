/* eslint @typescript-eslint/unbound-method: 0 */
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { mock, mockReset } from 'jest-mock-extended'
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm'
import { PostgresqlUserRepository } from '~/src/modules/User/Infrastructure/PostgreSqlUserRepository'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'

describe('PostgresqlUserRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserRepository = mock<Repository<UserRawModelWithRelations>>()
  const mockedEntityManager = mock<EntityManager>({})
  const now = new Date('2025-09-26T14:11:25Z')

  let baseRawUser: UserRawModelWithRelations

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedResolver)
    mockReset(mockedUserRepository)
    mockReset(mockedEntityManager)

    baseRawUser = makeRawUser({
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
  })

  const checkExistsByCalls = (context: TxContext, existBy: { [k: string]: string }) => {
    expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
    expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
    expect(mockedUserRepository.existsBy).toHaveBeenCalledTimes(1)

    expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
    expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserEntity)
    expect(mockedUserRepository.existsBy).toHaveBeenCalledWith(existBy)
  }

  describe('findWithLock', () => {
    const userId = IdentifierMother.valid()
    const userEmail = EmailAddressMother.random()

    const context: TxContext = { __opaque_tx_context: true }

    const mockedQueryBuilder = mock<SelectQueryBuilder<UserRawModelWithRelations>>()

    beforeEach(() => {
      mockReset(mockedQueryBuilder)

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.createQueryBuilder.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.where.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.setLock.mockReturnValue(mockedQueryBuilder)
    })

    const checkCommonCalls = (where: string, whereValue: { [k: string]: string }) => {
      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledTimes(1)
      expect(mockedQueryBuilder.where).toHaveBeenCalledTimes(1)
      expect(mockedQueryBuilder.setLock).toHaveBeenCalledTimes(1)
      expect(mockedQueryBuilder.getOne).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledWith(UserEntity, 'user')
      expect(mockedQueryBuilder.where).toHaveBeenCalledWith(where, whereValue)
      expect(mockedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
    }

    describe('findByIdWithLock', () => {
      const expectedUser = new UserTestBuilder().withId(userId).build()
      let rawUser: UserRawModelWithRelations

      beforeEach(() => {
        rawUser = {
          ...baseRawUser,
          id: userId.value,
        }
        mockedQueryBuilder.getOne.mockResolvedValue(rawUser)
      })

      describe('happy path', () => {
        it('should call services correctly when user is found', async () => {
          const repository = new PostgresqlUserRepository(mockedResolver)

          const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

          await repository.findByIdWithLock(userId.value, context)

          checkCommonCalls('user.id = :id', { id: userId.value })

          expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
          expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
        })

        it('should call services correctly when user is not found', async () => {
          mockedQueryBuilder.getOne.mockResolvedValue(null)

          const repository = new PostgresqlUserRepository(mockedResolver)

          const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

          await repository.findByIdWithLock(userId.value, context)

          checkCommonCalls('user.id = :id', { id: userId.value })

          expect(userModelTranslatorSpy).not.toHaveBeenCalled()
        })

        it('should return the correct data when user is found', async () => {
          const repository = new PostgresqlUserRepository(mockedResolver)

          jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

          const result = await repository.findByIdWithLock(userId.value, context)

          expect(result).toStrictEqual(expectedUser)
        })

        it('should return NULL when user is not found', async () => {
          mockedQueryBuilder.getOne.mockResolvedValue(null)

          const repository = new PostgresqlUserRepository(mockedResolver)

          const result = await repository.findByIdWithLock(userId.value, context)

          expect(result).toBeNull()
        })
      })

      describe('when there are errors', () => {
        it('should throw error when resolver fails', async () => {
          mockedResolver.resolve.mockImplementation(() => {
            throw new Error('Something went wrong')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByIdWithLock(userId.value, context)).rejects.toThrow(Error('Something went wrong'))
        })

        it('should throw error when ORM/Database fails', async () => {
          mockedQueryBuilder.getOne.mockImplementation(() => {
            throw new Error('Something went wrong')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByIdWithLock(userId.value, context)).rejects.toThrow(Error('Something went wrong'))
        })

        it('should throw error when translator fails', async () => {
          jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
            throw new Error('Something went wrong while translating entity to domain')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByIdWithLock(userId.value, context)).rejects.toThrow(
            Error('Something went wrong while translating entity to domain'),
          )
        })
      })
    })

    describe('findByEmailWithLock', () => {
      const expectedUser = new UserTestBuilder().withEmail(userEmail).build()
      let rawUser: UserRawModelWithRelations

      beforeEach(() => {
        rawUser = {
          ...baseRawUser,
          email: userEmail.value,
        }

        mockedQueryBuilder.getOne.mockResolvedValue(rawUser)
      })

      describe('happy path', () => {
        it('should call services correctly when user is found', async () => {
          const repository = new PostgresqlUserRepository(mockedResolver)

          const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

          await repository.findByEmailWithLock(userEmail.value, context)

          checkCommonCalls('user.email = :email', { email: userEmail.value })

          expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
          expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
        })

        it('should call services correctly when user is not found', async () => {
          mockedQueryBuilder.getOne.mockResolvedValue(null)

          const repository = new PostgresqlUserRepository(mockedResolver)

          const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

          await repository.findByEmailWithLock(userEmail.value, context)

          checkCommonCalls('user.email = :email', { email: userEmail.value })

          expect(userModelTranslatorSpy).not.toHaveBeenCalled()
        })

        it('should return the correct data when user is found', async () => {
          const repository = new PostgresqlUserRepository(mockedResolver)

          jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

          const result = await repository.findByEmailWithLock(userEmail.value, context)

          expect(result).toEqual(expectedUser)
        })

        it('should return NULL when user is not found', async () => {
          mockedQueryBuilder.getOne.mockResolvedValue(null)

          const repository = new PostgresqlUserRepository(mockedResolver)

          const result = await repository.findByEmailWithLock(userEmail.value, context)

          expect(result).toBeNull()
        })
      })

      describe('when there are errors', () => {
        it('should throw error when resolver fails', async () => {
          mockedResolver.resolve.mockImplementation(() => {
            throw new Error('Something went wrong')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByEmailWithLock(userEmail.value, context)).rejects.toThrow(Error('Something went wrong'))
        })

        it('should throw error when ORM/Database fails', async () => {
          mockedQueryBuilder.getOne.mockImplementation(() => {
            throw new Error('Something went wrong')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByEmailWithLock(userEmail.value, context)).rejects.toThrow(Error('Something went wrong'))
        })

        it('should throw error when translator fails', async () => {
          jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
            throw new Error('Something went wrong while translating entity to domain')
          })

          const repository = new PostgresqlUserRepository(mockedResolver)

          await expect(repository.findByEmailWithLock(userEmail.value, context)).rejects.toThrow(
            Error('Something went wrong while translating entity to domain'),
          )
        })
      })
    })
  })

  describe('findByEmail', () => {
    const userEmail = EmailAddressMother.valid()
    const context: TxContext = { __opaque_tx_context: true }
    let rawUser: UserRawModelWithRelations

    const expectedUser = new UserTestBuilder().withEmail(userEmail).build()

    beforeEach(() => {
      rawUser = {
        ...baseRawUser,
        email: userEmail.value,
      }

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
        expect(mockedUserRepository.findOneBy).toHaveBeenCalledWith({ email: userEmail.value })
      }

      it('should call services correctly when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        await repository.findByEmail(userEmail.value, context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userModelTranslatorSpy).toHaveBeenCalledWith(rawUser)
      })

      it('should call services correctly when user is not found', async () => {
        mockedUserRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDomain')

        await repository.findByEmail(userEmail.value, context)

        checkCommonCalls()

        expect(userModelTranslatorSpy).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        const repository = new PostgresqlUserRepository(mockedResolver)

        jest.spyOn(UserModelTranslator, 'toDomain').mockReturnValue(expectedUser)

        const result = await repository.findByEmail(userEmail.value, context)

        expect(result).toStrictEqual(expectedUser)
      })

      it('should return NULL when user is not found', async () => {
        mockedUserRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgresqlUserRepository(mockedResolver)

        const result = await repository.findByEmail(userEmail.value, context)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error when resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail(userEmail.value, context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error when ORM/Database fails', async () => {
        mockedUserRepository.findOneBy.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail(userEmail.value, context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error when translator fails', async () => {
        jest.spyOn(UserModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgresqlUserRepository(mockedResolver)

        await expect(repository.findByEmail(userEmail.value, context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })

  describe('checkEmailExists', () => {
    const email = EmailAddressMother.valid()
    const context: TxContext = { __opaque_tx_context: true }

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserRepository)
    })

    it('should call services correctly and return true when a user with the email exists', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockResolvedValueOnce(true)

      const repository = new PostgresqlUserRepository(mockedResolver)

      const result = await repository.checkEmailExists(email, context)

      checkExistsByCalls(context, { email: email.value })
      expect(result).toBe(true)
    })

    it('should call services correctly and return false when no user with the email exists', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockResolvedValueOnce(false)

      const repository = new PostgresqlUserRepository(mockedResolver)

      const result = await repository.checkEmailExists(email, context)

      checkExistsByCalls(context, { email: email.value })
      expect(result).toBe(false)
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.checkEmailExists(email, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const dbError = new Error('DB Connection lost')
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockRejectedValueOnce(dbError)

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.checkEmailExists(email, context)).rejects.toThrow(dbError)
    })
  })

  describe('checkUsernameExists', () => {
    const username = UserUsernameMother.valid()
    const context: TxContext = { __opaque_tx_context: true }

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserRepository)
    })

    it('should call services correctly and return true when a user with the username exists', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockResolvedValueOnce(true)

      const repository = new PostgresqlUserRepository(mockedResolver)

      const result = await repository.checkUsernameExists(username, context)

      checkExistsByCalls(context, { username: username.value })
      expect(result).toBe(true)
    })

    it('should call services correctly and return false when no user with the username exists', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockResolvedValueOnce(false)

      const repository = new PostgresqlUserRepository(mockedResolver)

      const result = await repository.checkUsernameExists(username, context)

      checkExistsByCalls(context, { username: username.value })
      expect(result).toBe(false)
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.checkUsernameExists(username, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const dbError = new Error('DB Connection lost')
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserRepository.existsBy.mockRejectedValueOnce(dbError)

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.checkUsernameExists(username, context)).rejects.toThrow(dbError)
    })
  })

  describe('save', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const user = new UserTestBuilder().build()

    let expectedRawUser: UserRawModelWithRelations

    beforeEach(() => {
      expectedRawUser = {
        ...baseRawUser,
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
      }

      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      const repository = new PostgresqlUserRepository(mockedResolver)

      const userModelTranslatorSpy = jest.spyOn(UserModelTranslator, 'toDatabase').mockReturnValueOnce(expectedRawUser)

      await repository.save(user, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(userModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.insert).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserEntity)
      expect(userModelTranslatorSpy).toHaveBeenCalledWith(user)
      expect(mockedUserRepository.insert).toHaveBeenCalledWith(expectedRawUser)
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.save(user, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const databaseError = new Error('DB Connection lost')

      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserModelTranslator, 'toDatabase').mockReturnValueOnce(expectedRawUser)
      mockedUserRepository.insert.mockImplementationOnce(() => {
        throw databaseError
      })

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.save(user, context)).rejects.toThrow(databaseError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Something went wrong while translating entity to database')
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgresqlUserRepository(mockedResolver)

      await expect(repository.save(user, context)).rejects.toThrow(translatorError)
    })
  })
})
