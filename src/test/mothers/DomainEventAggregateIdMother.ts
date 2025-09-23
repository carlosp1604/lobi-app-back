import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'

export class DomainEventAggregateIdMother {
  static valid(): DomainEventAggregateId {
    return DomainEventId.fromString(crypto.randomUUID())
  }
}
