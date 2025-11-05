/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { makeRawVerificationToken } from '~/src/test/modules/Auth/Infrastructure/VerificationTokenRawTestMaker'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm'
import {
  VerificationTokenEntity,
  VerificationTokenRawModel,
} from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/VerificationTokenModelTranslator'
import { PostgreSqlVerificationTokenRepository } from '~/src/modules/Auth/Infrastructure/PostgreSqlVerificationTokenRepository'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'

describe('PostgreSqlVerificationTokenRepository', () => {
  const fakeContext: TxContext = { __opaque_tx_context: true }
  const testTokenId = VerificationTokenIdMother.valid()

  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedEntityManager = mock<EntityManager>()
  const mockedQueryBuilder = mock<SelectQueryBuilder<VerificationTokenRawModel>>()
  const mockedVerificationTokenRepository = mock<Repository<VerificationTokenRawModel>>()

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedEntityManager)
    mockReset(mockedQueryBuilder)
    mockReset(mockedVerificationTokenRepository)

    jest.clearAllMocks()

    mockedResolver.resolve.mockReturnValue(mockedEntityManager)
  })

  describe('findByEmailAndPurposeWithLock', () => {
    const expectedVerificationToken = new VerificationTokenTestBuilder().withId(testTokenId).build()
    const rawToken = makeRawVerificationToken({ id: testTokenId.toString() })
    const verificationTokenPurpose = VerificationTokenPurpose.createAccount().toString()
    const email = UserEmailMother.random().toString()

    beforeEach(() => {
      mockedEntityManager.createQueryBuilder.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.where.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.andWhere.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.setLock.mockReturnValue(mockedQueryBuilder)
      mockedQueryBuilder.getOne.mockResolvedValue(rawToken)
    })

    describe('happy path', () => {
      const assertCommonCalls = () => {
        expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.where).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.andWhere).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledTimes(1)
        expect(mockedQueryBuilder.getOne).toHaveBeenCalledTimes(1)

        expect(mockedResolver.resolve).toHaveBeenCalledWith(fakeContext)
        expect(mockedEntityManager.createQueryBuilder).toHaveBeenCalledWith(VerificationTokenEntity, 'verification_token')
        expect(mockedQueryBuilder.where).toHaveBeenCalledWith('verification_token.email = :email', { email })
        expect(mockedQueryBuilder.andWhere).toHaveBeenCalledWith('verification_token.purpose = :purpose', {
          purpose: verificationTokenPurpose,
        })
        expect(mockedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write')
      }

      it('should call services correctly when verificationToken is found', async () => {
        const verificationTokenModelTranslator = jest
          .spyOn(VerificationTokenModelTranslator, 'toDomain')
          .mockReturnValue(expectedVerificationToken)

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
        await repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)

        assertCommonCalls()
        expect(verificationTokenModelTranslator).toHaveBeenCalledTimes(1)
        expect(verificationTokenModelTranslator).toHaveBeenCalledWith(rawToken)
      })

      it('should call services correctly when verificationToken is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const verificationTokenModelTranslator = jest.spyOn(VerificationTokenModelTranslator, 'toDomain')

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
        await repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)

        assertCommonCalls()
        expect(verificationTokenModelTranslator).not.toHaveBeenCalled()
      })

      it('should return the correct data when user is found', async () => {
        jest.spyOn(VerificationTokenModelTranslator, 'toDomain').mockReturnValue(expectedVerificationToken)

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
        const result = await repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)

        expect(result).toBe(expectedVerificationToken)
      })

      it('should return NULL when user is not found', async () => {
        mockedQueryBuilder.getOne.mockResolvedValue(null)

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
        const result = await repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)

        expect(result).toBeNull()
      })
    })

    describe('when there are errors', () => {
      it('should throw error if resolver fails', async () => {
        mockedResolver.resolve.mockImplementation(() => {
          throw new Error('Something went wrong while resolving entityManager')
        })

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

        await expect(repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)).rejects.toThrow(
          Error('Something went wrong while resolving entityManager'),
        )
      })

      it('should throw error if ORM/Database fails', async () => {
        mockedQueryBuilder.getOne.mockImplementation(() => {
          throw new Error('Something went wrong while retrieving data from database')
        })

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

        await expect(repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)).rejects.toThrow(
          Error('Something went wrong while retrieving data from database'),
        )
      })

      it('should throw error if translator fails', async () => {
        jest.spyOn(VerificationTokenModelTranslator, 'toDomain').mockImplementation(() => {
          throw new Error('Something went wrong while translating entity to domain')
        })

        const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

        await expect(repository.findByEmailAndPurposeWithLock(email, verificationTokenPurpose, fakeContext)).rejects.toThrow(
          Error('Something went wrong while translating entity to domain'),
        )
      })
    })
  })

  describe('save', () => {
    const verificationTokenToSave = new VerificationTokenTestBuilder().withId(testTokenId).build()
    const rawToken = makeRawVerificationToken({ id: testTokenId.toString() })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValue(mockedVerificationTokenRepository)
      mockedVerificationTokenRepository.save.mockResolvedValue(rawToken)
    })

    it('should call services correctly', async () => {
      const verificationTokenModelTranslator = jest.spyOn(VerificationTokenModelTranslator, 'toDatabase').mockReturnValue(rawToken)

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
      await repository.save(verificationTokenToSave, fakeContext)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(verificationTokenModelTranslator).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(fakeContext)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(VerificationTokenEntity)
      expect(verificationTokenModelTranslator).toHaveBeenCalledWith(verificationTokenToSave)
      expect(mockedVerificationTokenRepository.save).toHaveBeenCalledWith(rawToken)
    })

    it('should throw error if resolver fails', async () => {
      mockedResolver.resolve.mockImplementation(() => {
        throw new Error('Something went wrong while resolving entityManager')
      })

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

      await expect(repository.save(verificationTokenToSave, fakeContext)).rejects.toThrow(
        Error('Something went wrong while resolving entityManager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedVerificationTokenRepository.save.mockImplementation(() => {
        throw new Error('Something went wrong while saving data to database')
      })

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

      await expect(repository.save(verificationTokenToSave, fakeContext)).rejects.toThrow(
        Error('Something went wrong while saving data to database'),
      )
    })

    it('should throw error if translator fails', async () => {
      jest.spyOn(VerificationTokenModelTranslator, 'toDatabase').mockImplementation(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

      await expect(repository.save(verificationTokenToSave, fakeContext)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })

  describe('delete', () => {
    const verificationTokenId = VerificationTokenIdMother.valid().toString()

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValue(mockedVerificationTokenRepository)
      mockedVerificationTokenRepository.delete.mockResolvedValue({ raw: {}, affected: 1 })
    })

    it('should call delete with the correct ID', async () => {
      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)
      await repository.delete(verificationTokenId, fakeContext)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(fakeContext)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(VerificationTokenEntity)
      expect(mockedVerificationTokenRepository.delete).toHaveBeenCalledWith({ id: verificationTokenId })
    })

    it('should throw error if resolver fails', async () => {
      mockedResolver.resolve.mockImplementation(() => {
        throw new Error('Something went wrong while resolving entityManager')
      })

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

      await expect(repository.delete(verificationTokenId, fakeContext)).rejects.toThrow(
        Error('Something went wrong while resolving entityManager'),
      )
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedVerificationTokenRepository.delete.mockImplementation(() => {
        throw new Error('Something went wrong while deleting data from database')
      })

      const repository = new PostgreSqlVerificationTokenRepository(mockedResolver)

      await expect(repository.delete(verificationTokenId, fakeContext)).rejects.toThrow(
        Error('Something went wrong while deleting data from database'),
      )
    })
  })
})
