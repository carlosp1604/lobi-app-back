/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import {
  UserSessionEntity,
  UserSessionRawModel,
  UserSessionRawWithRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'
import { PostgreSqlUserSessionRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserSessionRepository'
import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import SpyInstance = jest.SpyInstance
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'

describe('PostgreSqlUserSessionRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserSessionRepository = mock<Repository<typeof UserSessionEntity>>()
  const mockedEntityManager = mock<EntityManager>()
  const now = new Date('2025-09-29T18:47:54Z')

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserSessionRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('save', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const userSession = new UserSessionTestBuilder().build()

    const expectedRawUserSession: UserSessionRawModel = {
      id: 'tests-session-id',
      user_id: 'tests-user_id',
      token_hash: 'test-token-hash',
      expires_at: new Date(now.getTime() + 600),
      revoked_at: null,
      ip_hash: null,
      user_agent: 'LobiApp/1.0 (CarlosP at the controls)',
      device_country: null,
      device_city: null,
      device_timezone: null,
      created_at: now,
      updated_at: now,
    }

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserSessionRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawUserSession)

      await repository.save(userSession, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledWith(userSession)
      expect(mockedUserSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionRepository.save).toHaveBeenCalledWith(expectedRawUserSession)
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save(userSession, context)).rejects.toThrow(Error('Something went wrong while resolving entity manager'))
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockReturnValueOnce(expectedRawUserSession)
      mockedUserSessionRepository.save.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save(userSession, context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.save(userSession, context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })

  describe('revokeOldestAndSave', () => {
    const context: TxContext = { __opaque_tx_context: true }
    const maxSessions = 3
    const userSession = new UserSessionTestBuilder().build()

    const expectedRawUserSession: UserSessionRawModel = {
      id: 'tests-session-id',
      user_id: 'tests-user_id',
      token_hash: 'test-token-hash',
      expires_at: new Date(now.getTime() + 600),
      revoked_at: null,
      ip_hash: null,
      user_agent: 'LobiApp/1.0 (CarlosP at the controls)',
      device_country: null,
      device_city: null,
      device_timezone: null,
      created_at: now,
      updated_at: now,
    }

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawUserSession)

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await repository.revokeOldestAndSave(userSession, maxSessions, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledWith(userSession)

      const [sql, params] = mockedEntityManager.query.mock.calls[0]

      expect(sql).toContain('UPDATE user_sessions')
      expect(sql).toContain('pg_advisory_xact_lock')
      expect(sql).toContain('WITH')
      expect(sql).toContain('UPDATE user_sessions')

      expect(sql).toContain('INSERT INTO user_sessions')
      expect(params).toEqual([
        expectedRawUserSession.user_id,
        maxSessions,
        expectedRawUserSession.id,
        expectedRawUserSession.token_hash,
        expectedRawUserSession.expires_at,
        expectedRawUserSession.ip_hash,
        expectedRawUserSession.user_agent,
        expectedRawUserSession.device_country,
        expectedRawUserSession.device_city,
        expectedRawUserSession.device_timezone,
      ])
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.revokeOldestAndSave(userSession, maxSessions, context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.revokeOldestAndSave(userSession, maxSessions, context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.query.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.revokeOldestAndSave(userSession, maxSessions, context)).rejects.toThrow(Error('Something went wrong'))
    })
  })

  describe('existsDevice', () => {
    const mockedQueryBuilder = mock<SelectQueryBuilder<UserSessionRawWithRelationships>>()
    const userSession = new UserSessionTestBuilder().build()

    const baseExpectedRawUserSession: UserSessionRawModel = {
      id: 'tests-session-id',
      user_id: 'tests-user_id',
      token_hash: 'test-token-hash',
      expires_at: new Date(now.getTime() + 600),
      revoked_at: null,
      ip_hash: null,
      user_agent: 'LobiApp/1.0 (CarlosP at the controls)',
      device_country: null,
      device_city: null,
      device_timezone: null,
      created_at: now,
      updated_at: now,
    }

    beforeEach(() => {
      mockReset(mockedQueryBuilder)

      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserSessionRepository)
      mockedQueryBuilder.select.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.where.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.andWhere.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.andWhere.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.andWhere.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.andWhere.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedQueryBuilder.limit.mockReturnValueOnce(mockedQueryBuilder as any)
    })

    const checkCommonCalls = (userSessionModelTranslatorSpy: SpyInstance<UserSessionModelTranslator>, userSession: UserSession) => {
      expect(mockedResolver.resolve).toHaveBeenCalled()
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserSessionEntity)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userSessionModelTranslatorSpy).toHaveBeenCalledWith(userSession)
      expect(mockedUserSessionRepository.createQueryBuilder).toHaveBeenCalledTimes(1)
      expect(mockedUserSessionRepository.createQueryBuilder).toHaveBeenCalledWith('s')
      expect(mockedQueryBuilder.select).toHaveBeenCalledWith('1')
      expect(mockedQueryBuilder.where).toHaveBeenCalledWith('s.user_id = :user_id', { user_id: 'tests-user_id' })
      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(1, 's.revoked_at IS NULL')
      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(2, 's.expires_at > NOW()')
    }

    it('should call services correctly when user session has ipHash', async () => {
      mockedUserSessionRepository.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      mockedQueryBuilder.getRawOne.mockResolvedValueOnce(null)

      const expectedRawUserSessionWithIpHash = {
        ...baseExpectedRawUserSession,
        ip_hash: 'test-ip-hash',
      }

      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawUserSessionWithIpHash)

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await repository.existsDevice(userSession)

      checkCommonCalls(userSessionModelTranslatorSpy, userSession)

      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(3, 's.ip_hash = :ip_hash', { ip_hash: 'test-ip-hash' })
      expect(mockedQueryBuilder.andWhere).not.toHaveBeenCalledWith('s.ip_hash IS NULL')
      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(4, 's.user_agent = :user_agent', {
        user_agent: 'LobiApp/1.0 (CarlosP at the controls)',
      })
      expect(mockedQueryBuilder.limit).toHaveBeenCalledWith(1)
      expect(mockedQueryBuilder.getRawOne).toHaveBeenCalled()
    })

    it('should call services correctly when user session does not has ipHash', async () => {
      mockedUserSessionRepository.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      mockedQueryBuilder.getRawOne.mockResolvedValueOnce(null)

      const expectedRawUserSessionWithoutIpHash = {
        ...baseExpectedRawUserSession,
        ip_hash: null,
      }

      const userSessionModelTranslatorSpy = jest
        .spyOn(UserSessionModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawUserSessionWithoutIpHash)

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await repository.existsDevice(userSession)

      checkCommonCalls(userSessionModelTranslatorSpy, userSession)

      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(3, 's.ip_hash IS NULL')
      expect(mockedQueryBuilder.andWhere).not.toHaveBeenCalledWith('s.ip_hash = :ip_hash', expect.any(Object))
      expect(mockedQueryBuilder.andWhere).toHaveBeenNthCalledWith(4, 's.user_agent = :user_agent', {
        user_agent: 'LobiApp/1.0 (CarlosP at the controls)',
      })
      expect(mockedQueryBuilder.limit).toHaveBeenCalledWith(1)
      expect(mockedQueryBuilder.getRawOne).toHaveBeenCalled()
    })

    it('should return true if getRawOne returns a truthy value', async () => {
      mockedUserSessionRepository.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      mockedQueryBuilder.getRawOne.mockResolvedValueOnce(1)

      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockReturnValueOnce(baseExpectedRawUserSession)

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const result = await repository.existsDevice(userSession)

      expect(result).toBe(true)
    })

    it('should return false if getRawOne returns a falsy value', async () => {
      mockedUserSessionRepository.createQueryBuilder.mockReturnValueOnce(mockedQueryBuilder as any)
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      mockedQueryBuilder.getRawOne.mockResolvedValueOnce(null)

      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockReturnValueOnce(baseExpectedRawUserSession)

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      const result = await repository.existsDevice(userSession)

      expect(result).toBe(false)
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.existsDevice(userSession)).rejects.toThrow(Error('Something went wrong while resolving entity manager'))
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockReturnValueOnce(baseExpectedRawUserSession)
      mockedUserSessionRepository.createQueryBuilder.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.existsDevice(userSession)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserSessionModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserSessionRepository(mockedResolver)

      await expect(repository.existsDevice(userSession)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })
})
