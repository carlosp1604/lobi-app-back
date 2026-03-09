/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionEntity, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { makeRawSession } from '~/src/test/modules/Auth/Infrastructure/UserSessionRawTestMaker'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'

describe('PostgreSqlUserSessionRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedEntityManager = mock<EntityManager>()
  const mockedUserSessionRepository = mock<Repository<UserSessionRawWithRelationships>>()

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedResolver)
    mockReset(mockedEntityManager)
    mockReset(mockedUserSessionRepository)
  })

  describe('findUserActiveSessions', () => {
    const context: TxContext = { __opaque_tx_context: true }
    const userId = IdentifierMother.valid()
    const now = new Date('2025-10-18T09:37:55Z')

    const expectedUserSession = new UserSessionTestBuilder().build()
    const expectedUserSession2 = new UserSessionTestBuilder().build()

    const rawUserSession = makeRawSession()
    const rawUserSession2 = makeRawSession()

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserSessionRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserSessionRepository.findBy.mockResolvedValueOnce([rawUserSession, rawUserSession2])
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDomain')
        .mockReturnValueOnce(expectedUserSession)
        .mockReturnValueOnce(expectedUserSession2)

      await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(2)
      expect(userSessionModelTranslatorSpy).toHaveBeenNthCalledWith(1, rawUserSession)
      expect(userSessionModelTranslatorSpy).toHaveBeenNthCalledWith(2, rawUserSession2)
      expect(mockedUserSessionRepository.findBy).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionRepository.findBy).toHaveBeenCalledWith({
        user_id: userId.toString(),
        revoked_at: IsNull(),
        expires_at: MoreThan(now),
      })
    })

    it('should return the correct data', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserSessionRepository.findBy.mockResolvedValueOnce([rawUserSession, rawUserSession2])
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      jest
        .spyOn(UserSessionModelTranslator, 'toDomain')
        .mockReturnValueOnce(expectedUserSession)
        .mockReturnValueOnce(expectedUserSession2)

      const result = await repository.findUserActiveSessions(userId.toString(), now, context)

      expect(result.length).toBe(2)
      expect(result).toEqual([expectedUserSession, expectedUserSession2])
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.findUserActiveSessions(userId.toString(), now, context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserSessionRepository.findBy.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.findUserActiveSessions(userId.toString(), now, context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserSessionRepository.findBy.mockResolvedValueOnce([rawUserSession])
      jest.spyOn(UserSessionModelTranslator, 'toDomain').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.findUserActiveSessions(userId.toString(), now, context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })

  describe('save', () => {
    const context: TxContext = { __opaque_tx_context: true }
    const userId = IdentifierMother.valid()

    const userSession = new UserSessionTestBuilder().build()
    const userSession2 = new UserSessionTestBuilder().build()

    const expectedRawUserSession = makeRawSession({
      user_id: userId.toString(),
      revoked_at: null,
      ip_hash: null,
      user_agent: UserAgentMother.forTesting().toString(),
    })

    const expectedRawUserSession2 = makeRawSession({
      user_id: userId.toString(),
      revoked_at: null,
      ip_hash: null,
      user_agent: UserAgentMother.forTesting().toString(),
    })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserSessionRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawUserSession)
        .mockReturnValueOnce(expectedRawUserSession2)

      await repository.save([userSession, userSession2], context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(2)
      expect(userSessionModelTranslatorSpy).toHaveBeenNthCalledWith(1, userSession)
      expect(userSessionModelTranslatorSpy).toHaveBeenNthCalledWith(2, userSession2)
      expect(mockedUserSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionRepository.save).toHaveBeenCalledWith([expectedRawUserSession, expectedRawUserSession2])
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save([userSession], context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockReturnValueOnce(expectedRawUserSession)
      mockedUserSessionRepository.save.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save([userSession], context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save([userSession], context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })

  describe('findByHash', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const tokenHashValue = UserSessionTokenHashMother.valid()

    const expectedSession = new UserSessionTestBuilder().withTokenHash(tokenHashValue).build()
    let rawSession: UserSessionRawWithRelationships

    beforeEach(() => {
      rawSession = makeRawSession({
        token_hash: tokenHashValue.value,
      })

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserSessionRepository)
      mockedUserSessionRepository.findOneBy.mockResolvedValue(rawSession)
    })

    describe('happy path', () => {
      const checkCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
        expect(mockedUserSessionRepository.findOneBy).toHaveBeenCalledTimes(1)

        expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
        expect(mockedUserSessionRepository.findOneBy).toHaveBeenCalledWith({ token_hash: tokenHashValue.value })
      }

      it('should call services correctly and return the correct data when user is found', async () => {
        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        const userSessionModelTranslatorSpy = jest.spyOn(UserSessionModelTranslator, 'toDomain').mockReturnValue(expectedSession)

        const result = await repository.findByHash(tokenHashValue.value, context)

        checkCommonCalls()

        expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userSessionModelTranslatorSpy).toHaveBeenCalledWith(rawSession)
        expect(result).toBe(expectedSession)
      })

      it('should call services correctly and return null when user is not found', async () => {
        mockedUserSessionRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        const userSessionModelTranslatorSpy = jest.spyOn(UserSessionModelTranslator, 'toDomain').mockReturnValue(expectedSession)

        const result = await repository.findByHash(tokenHashValue.value, context)

        checkCommonCalls()

        expect(userSessionModelTranslatorSpy).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error when resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findByHash(tokenHashValue.value, context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error when ORM/Database fails', async () => {
        mockedUserSessionRepository.findOneBy.mockImplementation(() => {
          throw new Error('Something went wrong')
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findByHash(tokenHashValue.value, context)).rejects.toThrow(Error('Something went wrong'))
      })

      it('should throw error when translator fails', async () => {
        jest.spyOn(UserSessionModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findByHash(tokenHashValue.value, context)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })

  describe('findById', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const sessionId = IdentifierMother.valid()

    const expectedSession = new UserSessionTestBuilder().withId(sessionId).build()
    let rawSession: UserSessionRawWithRelationships

    beforeEach(() => {
      rawSession = makeRawSession({
        id: sessionId.value,
      })

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserSessionRepository)
      mockedUserSessionRepository.findOneBy.mockResolvedValue(rawSession)
    })

    describe('happy path', () => {
      const checkCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
        expect(mockedUserSessionRepository.findOneBy).toHaveBeenCalledTimes(1)

        expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
        expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
        expect(mockedUserSessionRepository.findOneBy).toHaveBeenCalledWith({ id: sessionId.value })
      }

      it('should call services correctly and return the correct data when session is found', async () => {
        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        const userSessionModelTranslatorSpy = jest.spyOn(UserSessionModelTranslator, 'toDomain').mockReturnValue(expectedSession)

        const result = await repository.findById(sessionId, context)

        checkCommonCalls()

        expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(1)
        expect(userSessionModelTranslatorSpy).toHaveBeenCalledWith(rawSession)
        expect(result).toBe(expectedSession)
      })

      it('should call services correctly and return null when session is not found', async () => {
        mockedUserSessionRepository.findOneBy.mockResolvedValue(null)

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        const userSessionModelTranslatorSpy = jest.spyOn(UserSessionModelTranslator, 'toDomain').mockReturnValue(expectedSession)

        const result = await repository.findById(sessionId, context)

        checkCommonCalls()

        expect(userSessionModelTranslatorSpy).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error when resolver fails', async () => {
        const resolverError = new Error('Something went wrong')

        mockedResolver.resolve.mockImplementation(() => {
          throw resolverError
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findById(sessionId, context)).rejects.toThrow(resolverError)
      })

      it('should throw error when ORM/Database fails', async () => {
        const databaseError = new Error('Something went wrong')

        mockedUserSessionRepository.findOneBy.mockImplementation(() => {
          throw databaseError
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findById(sessionId, context)).rejects.toThrow(databaseError)
      })

      it('should throw error when translator fails', async () => {
        const translatorError = new Error('Something went wrong while translating entity to domain')

        jest.spyOn(UserSessionModelTranslator, 'toDomain').mockImplementation(() => {
          throw translatorError
        })

        const repository = new PostgreSqlUserSessionRepository(mockedResolver)

        await expect(repository.findById(sessionId, context)).rejects.toThrow(translatorError)
      })
    })
  })
})
