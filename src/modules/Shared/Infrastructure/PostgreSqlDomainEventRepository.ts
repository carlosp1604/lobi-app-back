import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'

export class PostgreSqlDomainEventRepository implements DomainEventRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the given domain event
   * @param domainEvent DomainEvent to save
   * @param context the transactional context
   */
  public async save(domainEvent: DomainEvent, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const domainEventRepository = entityManager.getRepository(DomainEventEntity)

    const domainEventRawModel = DomainEventModelTranslator.toDatabase(domainEvent)

    await domainEventRepository.insert(domainEventRawModel)
  }
}
