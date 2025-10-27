import { EntityManager } from 'typeorm'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'

export class DomainEventDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async findByAggregateTypeAndId(aggregateId: string, aggregateType: string) {
    const domainEventRepository = this.entityManager.getRepository(DomainEventEntity)

    return domainEventRepository.findBy({
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
    })
  }
}
