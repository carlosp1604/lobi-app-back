import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { DomainEventEntity, DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'

describe('PostgreSqlDomainEventRepository', () => {
  const userId = IdentifierMother.valid()
  const domainEventId = IdentifierMother.valid()
  const now = new Date('2025-10-07T19:31:57Z')

  let runner: QueryRunner

  withTransaction((queryRunner) => {
    runner = queryRunner
  })

  const mockedResolver = mock<TypeOrmManagerResolver>()

  beforeEach(() => {
    mockReset(mockedResolver)

    mockedResolver.resolve.mockReturnValueOnce(runner.manager)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('save', () => {
    let domainEventTestBuilder = new DomainEventTestBuilder()

    beforeEach(async () => {
      const userRepository = runner.manager.getRepository(UserEntity)
      const rawUser = makeRawUser({
        id: userId.value,
      })
      await userRepository.save(rawUser)

      domainEventTestBuilder = new DomainEventTestBuilder()
        .withId(domainEventId)
        .withMetadata({ metaProperty: 'value' })
        .withPayload({ payloadProperty: 'value' })
        .withName(DomainEventName.successfulLogin())
        .withAggregateType(DomainEventAggregateType.user())
        .withAggregateId(IdentifierMother.valid())
        .withOccurredAt(now)
    })

    it('should save domainEvent correctly', async () => {
      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      const domainEvent = domainEventTestBuilder.build()

      const context = new TypeOrmTxContext(runner.manager)

      await repository.save(domainEvent, context)

      const domainEventRepository = runner.manager.getRepository(DomainEventEntity)

      const foundDomainEvent = await domainEventRepository.findOneBy({
        id: domainEventId.value,
      })

      expect(foundDomainEvent?.id).toBe(domainEvent.id.value)
      expect(foundDomainEvent?.name).toBe(domainEvent.name.value)
      expect(foundDomainEvent?.aggregate_type).toBe(domainEvent.aggregateType.value)
      expect(foundDomainEvent?.aggregate_id).toBe(domainEvent.aggregateId.value)
      expect(foundDomainEvent?.metadata).toEqual(domainEvent.metadata)
      expect(foundDomainEvent?.payload).toEqual(domainEvent.payload)
      expect(foundDomainEvent?.occurred_at).toEqual(domainEvent.occurredAt)
    })

    it('should throw error if domainEvent already exists', async () => {
      const repository = new PostgreSqlDomainEventRepository(mockedResolver)
      const domainEventRepository = runner.manager.getRepository(DomainEventEntity)

      const domainEvent = domainEventTestBuilder.build()

      const rawDomainEvent: DomainEventRawModel = {
        id: domainEvent.id.value,
        name: domainEvent.name.value,
        metadata: domainEvent.metadata,
        payload: domainEvent.payload,
        version: domainEvent.version,
        occurred_at: domainEvent.occurredAt,
        aggregate_type: domainEvent.aggregateType.value,
        aggregate_id: domainEvent.aggregateId.value,
      }

      await domainEventRepository.save(rawDomainEvent)

      const context = new TypeOrmTxContext(runner.manager)

      await expect(repository.save(domainEvent, context)).rejects.toThrow()
    })
  })
})
