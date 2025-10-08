import { QueryRunner } from 'typeorm'
import { withTransaction } from '~/src/test/utils/withTransaction'
import { mock, mockReset } from 'jest-mock-extended'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PostgreSqlDomainEventRepository } from '~/src/modules/Shared/Infrastructure/PostgreSqlDomainEventRepository'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { DomainEventEntity, DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'

describe('PostgreSqlDomainEventRepository', () => {
  const userId = UserIdMother.valid()
  const domainEventId = DomainEventIdMother.valid()
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
        id: userId.toString(),
      })
      await userRepository.save(rawUser)

      domainEventTestBuilder = new DomainEventTestBuilder()
        .withId(domainEventId)
        .withMetadata({ metaProperty: 'value' })
        .withPayload({ payloadProperty: 'value' })
        .withName(DomainEventName.successfulLogin())
        .withAggregateType(DomainEventAggregateType.user())
        .withAggregateId(DomainEventIdMother.valid())
        .withOccurredAt(now)
    })

    it('should save domainEvent correctly', async () => {
      const repository = new PostgreSqlDomainEventRepository(mockedResolver)

      const domainEvent = domainEventTestBuilder.build()

      const context = new TypeOrmTxContext(runner.manager)

      await repository.save(domainEvent, context)

      const domainEventRepository = runner.manager.getRepository(DomainEventEntity)

      const foundDomainEvent = await domainEventRepository.findOneBy({
        id: domainEventId.toString(),
      })

      expect(foundDomainEvent?.id).toBe(domainEvent.id.toString())
      expect(foundDomainEvent?.name).toBe(domainEvent.name.toString())
      expect(foundDomainEvent?.aggregate_type).toBe(domainEvent.aggregateType.toString())
      expect(foundDomainEvent?.aggregate_id).toBe(domainEvent.aggregateId.toString())
      expect(foundDomainEvent?.metadata).toEqual(domainEvent.metadata)
      expect(foundDomainEvent?.payload).toEqual(domainEvent.payload)
      expect(foundDomainEvent?.occurred_at.getTime()).toBe(domainEvent.occurredAt.getTime())
    })

    it('should throw error if domainEvent already exists', async () => {
      const repository = new PostgreSqlDomainEventRepository(mockedResolver)
      const domainEventRepository = runner.manager.getRepository(DomainEventEntity)

      const domainEvent = domainEventTestBuilder.build()

      const rawDomainEvent: DomainEventRawModel = {
        id: domainEvent.id.toString(),
        name: domainEvent.name.toString(),
        metadata: domainEvent.metadata,
        payload: domainEvent.payload,
        version: domainEvent.version,
        occurred_at: domainEvent.occurredAt,
        aggregate_type: domainEvent.aggregateType.toString(),
        aggregate_id: domainEvent.aggregateId.toString(),
      }
      await domainEventRepository.save(rawDomainEvent)

      const context = new TypeOrmTxContext(runner.manager)

      await expect(repository.save(domainEvent, context)).rejects.toThrow()
    })
  })
})
