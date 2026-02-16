/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { EntityManager, Repository } from 'typeorm'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { OwnerProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { SportsmanProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { OwnerProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/OwnerProfileTestBuilder'
import { makeRawOwnerProfile } from '~/src/test/modules/User/Infrastructure/Profile/OwnerProfileRawTestMaker'
import { OwnerProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/OwnerProfileModelTranslator'
import { PostgreSqlProfileRepository } from '~/src/modules/User/Infrastructure/Profile/PostgreSqlProfileRepository'
import { SportsmanProfileTestBuilder } from '~/src/test/modules/User/Domain/Profile/SportsmanProfileTestBuilder'
import { makeRawSportsmanProfile } from '~/src/test/modules/User/Infrastructure/Profile/SportsmanProfileRawTestMaker'
import { SportsmanProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/SportsmanProfileModelTranslator'

describe('PostgreSqlProfileRepository', () => {
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedEntityManager = mock<EntityManager>()

  const mockedOwnerRepository = mock<Repository<typeof OwnerProfileEntity>>()
  const mockedSportsmanRepository = mock<Repository<typeof SportsmanProfileEntity>>()

  const context: TxContext = { __opaque_tx_context: true }

  beforeEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedEntityManager)
    mockReset(mockedOwnerRepository)
    mockReset(mockedSportsmanRepository)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('saveOwnerProfile', () => {
    const ownerProfile = new OwnerProfileTestBuilder().build()
    const rawOwnerProfile = makeRawOwnerProfile({ id: ownerProfile.id.value })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedOwnerRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      const translatorSpy = jest.spyOn(OwnerProfileModelTranslator, 'toDatabase').mockReturnValueOnce(rawOwnerProfile)

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await repository.saveOwnerProfile(ownerProfile, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(translatorSpy).toHaveBeenCalledTimes(1)
      expect(mockedOwnerRepository.insert).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(OwnerProfileEntity)
      expect(translatorSpy).toHaveBeenCalledWith(ownerProfile)
      expect(mockedOwnerRepository.insert).toHaveBeenCalledWith(rawOwnerProfile)
    })

    it('should throw error when resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveOwnerProfile(ownerProfile, context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error when ORM/Database fails', async () => {
      const databaseError = new Error('Unexpected DB error')

      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(OwnerProfileModelTranslator, 'toDatabase').mockReturnValueOnce(rawOwnerProfile)

      mockedOwnerRepository.insert.mockImplementationOnce(() => {
        throw databaseError
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveOwnerProfile(ownerProfile, context)).rejects.toThrow(databaseError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Unexpected Translator error')

      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      jest.spyOn(OwnerProfileModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveOwnerProfile(ownerProfile, context)).rejects.toThrow(translatorError)
    })
  })

  describe('saveSportsmanProfile', () => {
    const sportsmanProfile = new SportsmanProfileTestBuilder().build()
    const rawSportsmanProfile = makeRawSportsmanProfile({ id: sportsmanProfile.id.value })

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedSportsmanRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      const translatorSpy = jest.spyOn(SportsmanProfileModelTranslator, 'toDatabase').mockReturnValueOnce(rawSportsmanProfile)

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await repository.saveSportsmanProfile(sportsmanProfile, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(translatorSpy).toHaveBeenCalledTimes(1)
      expect(mockedSportsmanRepository.insert).toHaveBeenCalledTimes(1)

      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(SportsmanProfileEntity)
      expect(translatorSpy).toHaveBeenCalledWith(sportsmanProfile)
      expect(mockedSportsmanRepository.insert).toHaveBeenCalledWith(rawSportsmanProfile)
    })

    it('should throw error when resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveSportsmanProfile(sportsmanProfile, context)).rejects.toThrow(
        Error('Something went wrong while resolving entity manager'),
      )
    })

    it('should throw error when ORM/Database fails', async () => {
      const dbError = new Error('Unexpected DB error')

      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(SportsmanProfileModelTranslator, 'toDatabase').mockReturnValueOnce(rawSportsmanProfile)

      mockedSportsmanRepository.insert.mockImplementationOnce(() => {
        throw dbError
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveSportsmanProfile(sportsmanProfile, context)).rejects.toThrow(dbError)
    })

    it('should throw error when translator fails', async () => {
      const translatorError = new Error('Unexpected Translator error')

      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)

      jest.spyOn(SportsmanProfileModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw translatorError
      })

      const repository = new PostgreSqlProfileRepository(mockedResolver)

      await expect(repository.saveSportsmanProfile(sportsmanProfile, context)).rejects.toThrow(translatorError)
    })
  })
})
