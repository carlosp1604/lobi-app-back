import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

export class DomainEventAggregateId extends UuidValueObject {
  private __domainEventAggregateIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!UuidValueObject.isValidId(normalized)) {
      throw DomainEventDomainException.invalidDomainEventAggregateId(value)
    }
  }

  static fromString(value: string): DomainEventAggregateId {
    return new DomainEventAggregateId(value)
  }
}
