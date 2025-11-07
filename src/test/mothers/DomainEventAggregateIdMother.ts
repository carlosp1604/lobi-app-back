import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'

export class DomainEventAggregateIdMother {
  static valid(): DomainEventAggregateId {
    return DomainEventAggregateId.fromString(crypto.randomUUID())
  }
}
