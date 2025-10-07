/* eslint @typescript-eslint/unbound-method: 0 */
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { DomainEventEntity, DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/DomainEvent.entity'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { EntityManager, Repository } from 'typeorm'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'

describe('PostgreSqlDomainEventRepository', () => {
  const now = new Date('2025-10-07T15:07:33Z')
  const mockedResolver = mock<TypeOrmManagerResolver>()
  const mockedDomainEventRepository = mock<Repository<typeof DomainEventEntity>>()
  const mockedEntityManager = mock<EntityManager>()

  afterEach(() => {
    mockReset(mockedResolver)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedEntityManager)

    jest.restoreAllMocks()
  })

  describe('save', () => {
    const context: TxContext = { __opaque_tx_context: true }

    const domainEvent = new DomainEventTestBuilder().build()

    const expectedRawDomainEvent: DomainEventRawModel = {
      id: 'test-domain-event-id',
      name: 'test-domain-event-name',
      aggregate_id: 'test-domain-event-aggregate-id',
      aggregate_type: 'test-aggregate-type',
      occurred_at: now,
      metadata: { arguments: 1, result: 'ok', a: null },
      payload: {},
      version: 1,
    }

    beforeEach(() => {
      mockedEntityManager.getRepository.mockReturnValueOnce(mockedDomainEventRepository)
    })

    it('should call services correctly', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      const domainEventModelTranslatorSpy = jest
        .spyOn(DomainEventModelTranslator, 'toDatabase')
        .mockReturnValueOnce(expectedRawDomainEvent)

      await repository.save(domainEvent, context)

      expect(mockedResolver.resolve).toHaveBeenCalledTimes(1)
      expect(mockedResolver.resolve).toHaveBeenCalledWith(context)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledTimes(1)
      expect(mockedEntityManager.getRepository).toHaveBeenCalledWith(DomainEventEntity)
      expect(domainEventModelTranslatorSpy).toHaveBeenCalledTimes(1)
      expect(domainEventModelTranslatorSpy).toHaveBeenCalledWith(domainEvent)
      expect(mockedDomainEventRepository.insert).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.insert).toHaveBeenCalledWith(expectedRawDomainEvent)
    })

    it('should throw error if resolver throws', async () => {
      mockedResolver.resolve.mockImplementationOnce(() => {
        throw new Error('Something went wrong while resolving entity manager')
      })

      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      await expect(repository.save(domainEvent, context)).rejects.toThrow(Error('Something went wrong while resolving entity manager'))
    })

    it('should throw error if ORM/Database fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(DomainEventModelTranslator, 'toDatabase').mockReturnValueOnce(expectedRawDomainEvent)
      mockedDomainEventRepository.insert.mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      await expect(repository.save(domainEvent, context)).rejects.toThrow(Error('Something went wrong'))
    })

    it('should throw error if translator fails', async () => {
      mockedResolver.resolve.mockReturnValueOnce(mockedEntityManager)
      jest.spyOn(DomainEventModelTranslator, 'toDatabase').mockImplementationOnce(() => {
        throw new Error('Something went wrong while translating entity to database')
      })

      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      await expect(repository.save(domainEvent, context)).rejects.toThrow(
        Error('Something went wrong while translating entity to database'),
      )
    })
  })
})
