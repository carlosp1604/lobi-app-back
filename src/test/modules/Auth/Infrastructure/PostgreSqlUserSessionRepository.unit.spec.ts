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

describe('PostgreSqlUserSessionRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserSessionRepository = mock<Repository<UserSessionRawWithRelationships>>()
  const mockedEntityManager = mock<EntityManager>()

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserSessionRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
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
})
