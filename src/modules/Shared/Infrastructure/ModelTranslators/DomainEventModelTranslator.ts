import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'

export class DomainEventModelTranslator {
  public static toDatabase(domain: DomainEvent): DomainEventRawModel {
    return {
      id: domain.id.toString(),
      name: domain.name.toString(),
      aggregate_id: domain.aggregateId.toString(),
      aggregate_type: domain.aggregateType.toString(),
      metadata: domain.metadata,
      payload: domain.payload,
      occurred_at: domain.occurredAt,
      version: domain.version,
    }
  }
}
