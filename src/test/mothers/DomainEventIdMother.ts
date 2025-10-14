import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'

export class DomainEventIdMother {
  static valid(): DomainEventId {
    return DomainEventId.fromString(crypto.randomUUID())
  }
}
