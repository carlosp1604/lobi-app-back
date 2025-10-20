/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, EntitySchema, Repository } from 'typeorm'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import {
  UserCredentialEntity,
  UserCredentialRawWitRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'

describe('PostgreSqlUserCredentialRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserCredentialRepository = mock<Repository<typeof UserCredentialEntity>>()
  const mockedEntityManager = mock<EntityManager>({})
  const now = new Date('2025-09-26T19:21:38Z')

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserCredentialRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('saveLoginSuccess', () => {
    const userId = UserIdMother.valid().toString()
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(10).build()
    const context: TxContext = { __opaque_tx_context: true }

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.toString(),
      password_hash: 'expected-hash',
      created_at: now,
      updated_at: now,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: now,
    })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedUserCredentialRepository.update.mockResolvedValueOnce({} as any)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDatabase')
        .mockReturnValueOnce(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await repository.saveLoginSuccess(userCredential, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledWith(userCredential)
      expect(mockedUserCredentialRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedUserCredentialRepository.update).toHaveBeenCalledWith(userId.toString(), {
        locked_until: null,
        failed_attempts: 0,
        last_login_at: now,
        updated_at: now,
      })
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.saveLoginSuccess(userCredential, context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockReturnValueOnce(rawUserCredential)
      mockedUserCredentialRepository.update.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.saveLoginSuccess(userCredential, context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.saveLoginSuccess(userCredential, context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })

  describe('findByUserId', () => {
    const userId = UserIdMother.valid()
    const context: TxContext = { __opaque_tx_context: true }

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.toString(),
    })

    const expectedUserCredential = new UserCredentialTestBuilder().withUserId(userId).build()

    beforeEach(() => {
      mockReset(mockedResolver)
      mockReset(mockedEntityManager)
    })

    const checkCommonCalls = () => {
      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserCredentialEntity)
      expect(mockedUserCredentialRepository.findOneBy).toHaveBeenCalledTimes(1)
      expect(mockedUserCredentialRepository.findOneBy).toHaveBeenCalledWith({ user_id: userId.toString() })
    }

    it('should call services correctly when userCredential is found', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValueOnce(
        rawUserCredential as unknown as EntitySchema<UserCredentialRawWitRelationships>,
      )

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDomain')
        .mockReturnValueOnce(expectedUserCredential)

      await repository.findByUserId(userId.toString(), context)

      checkCommonCalls()
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledWith(rawUserCredential)
    })

    it('should call services correctly when userCredential is not found', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValueOnce(null)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDomain')
        .mockReturnValueOnce(expectedUserCredential)

      await repository.findByUserId(userId.toString(), context)

      checkCommonCalls()
      expect(userCredentialModelTranslatorSpy).not.toHaveBeenCalled()
    })

    it('should return the correct data when userCredential is found', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValueOnce(
        rawUserCredential as unknown as EntitySchema<UserCredentialRawWitRelationships>,
      )

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      jest.spyOn(UserCredentialModelTranslator, 'toDomain').mockReturnValueOnce(expectedUserCredential)

      const result = await repository.findByUserId(userId.toString(), context)

      expect(result).toBe(expectedUserCredential)
    })

    it('should return NULL when userCredential is not found', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValueOnce(null)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      const result = await repository.findByUserId(userId.toString(), context)

      expect(result).toBe(null)
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.toString(), context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.toString(), context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValueOnce(
        rawUserCredential as unknown as EntitySchema<UserCredentialRawWitRelationships>,
      )

      jest.spyOn(UserCredentialModelTranslator, 'toDomain').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.toString(), context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })
})
