/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, EntitySchema, Repository } from 'typeorm'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { PostgreSqlUserCredentialRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlUserCredentialRepository'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import {
  UserCredentialEntity,
  UserCredentialRawWitRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'

describe('PostgreSqlUserCredentialRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedUserCredentialRepository = mock<Repository<typeof UserCredentialEntity>>()
  const mockedEntityManager = mock<EntityManager>({})
  const now = new Date('2025-09-26T19:21:38Z')

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedUserCredentialRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('save', () => {
    const userId = IdentifierMother.valid()
    const userCredential = new UserCredentialTestBuilder().withUserId(userId).build()
    const context: TxContext = { __opaque_tx_context: true }

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.value,
      password_hash: userCredential.passwordHash.value,
      created_at: now,
      updated_at: now,
      failed_attempts: 0,
      locked_until: null,
      last_modified_at: null,
      last_login_at: null,
    })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValue(mockedEntityManager)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDatabase')
        .mockReturnValue(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await repository.save(userCredential, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedUserCredentialRepository.insert).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledWith(userCredential)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserCredentialEntity)
      expect(mockedUserCredentialRepository.insert).toHaveBeenCalledWith(rawUserCredential)
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.save(userCredential, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const dbError = new Error('Something went wrong with the database')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockReturnValue(rawUserCredential)
      mockedUserCredentialRepository.insert.mockImplementationOnce(() => {
        throw dbError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.save(userCredential, context)).rejects.toThrow(dbError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Something went wrong while translating entity to database')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.save(userCredential, context)).rejects.toThrow(translatorError)
    })
  })

  describe('saveLoginSuccess', () => {
    const userId = IdentifierMother.valid().value
    const userCredentialToUpdate = new UserCredentialTestBuilder().build()

    const context: TxContext = { __opaque_tx_context: true }

    const rawUserCredential = makeRawUserCredential({
      user_id: userId,
      created_at: now,
      updated_at: now,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: now,
      password_hash: PasswordHashMother.valid().value,
    })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValue(mockedEntityManager)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDatabase')
        .mockReturnValue(rawUserCredential)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await repository.update(userCredentialToUpdate, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledWith(userCredentialToUpdate)
      expect(mockedUserCredentialRepository.update).toHaveBeenCalledTimes(1)
      expect(mockedUserCredentialRepository.update).toHaveBeenCalledWith(userId, rawUserCredential)
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')

      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.update(userCredentialToUpdate, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const ormError = new Error('Something went wrong')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockReturnValue(rawUserCredential)
      mockedUserCredentialRepository.update.mockImplementationOnce(() => {
        throw ormError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.update(userCredentialToUpdate, context)).rejects.toThrow(ormError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Something went wrong while translating entity to database')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      jest.spyOn(UserCredentialModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.update(userCredentialToUpdate, context)).rejects.toThrow(translatorError)
    })
  })

  describe('findByUserId', () => {
    const userId = IdentifierMother.valid()
    const context: TxContext = { __opaque_tx_context: true }

    const rawUserCredential = makeRawUserCredential({
      user_id: userId.value,
    })

    const expectedUserCredential = new UserCredentialTestBuilder().withUserId(userId).build()

    beforeEach(() => {
      mockReset(mockedResolver)
      mockReset(mockedEntityManager)
    })

    const checkCommonCalls = () => {
      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedUserCredentialRepository.findOneBy).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(UserCredentialEntity)
      expect(mockedUserCredentialRepository.findOneBy).toHaveBeenCalledWith({ user_id: userId.value })
    }

    it('should call services correctly and return the correct data when userCredential is found', async () => {
      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValue(
        rawUserCredential as unknown as EntitySchema<UserCredentialRawWitRelationships>,
      )

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDomain')
        .mockReturnValue(expectedUserCredential)

      const result = await repository.findByUserId(userId.value, context)

      expect(result).toBe(expectedUserCredential)

      checkCommonCalls()
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(userCredentialModelTranslatorSpy).toHaveBeenCalledWith(rawUserCredential)
    })

    it('should call services correctly and return null when userCredential is not found', async () => {
      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValue(null)

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      const userCredentialModelTranslatorSpy = jest
        .spyOn(UserCredentialModelTranslator, 'toDomain')
        .mockReturnValue(expectedUserCredential)

      const result = await repository.findByUserId(userId.value, context)

      expect(result).toBeNull()

      checkCommonCalls()
      expect(userCredentialModelTranslatorSpy).not.toHaveBeenCalled()
    })

    it('should throw error when resolver throws', async () => {
      const resolverError = new Error('Something went wrong while resolving entity manager')
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw resolverError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.value, context)).rejects.toThrow(resolverError)
    })

    it('should throw error when ORM/Database fails', async () => {
      const ormError = new Error('Something went wrong')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockImplementationOnce(() => {
        throw ormError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.value, context)).rejects.toThrow(ormError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Something went wrong while translating entity to database')

      mockedResolver.resolve.mockReturnValue(mockedEntityManager)
      mockedEntityManager.getRepository.mockReturnValue(mockedUserCredentialRepository)
      mockedUserCredentialRepository.findOneBy.mockResolvedValue(
        rawUserCredential as unknown as EntitySchema<UserCredentialRawWitRelationships>,
      )

      jest.spyOn(UserCredentialModelTranslator, 'toDomain').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgreSqlUserCredentialRepository(mockedResolver)

      await expect(repository.findByUserId(userId.value, context)).rejects.toThrow(translatorError)
    })
  })
})
