import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

export class DomainEventId extends UuidValueObject {
  private __domainEventIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidId(normalized)) {
      throw DomainEventDomainException.invalidDomainEventId(value)
    }
  }

  static fromString(value: string): DomainEventId {
    return new DomainEventId(value)
  }
}
