import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

export enum ValidDomainEventAggregateTypes {
  USER = 'user',
  VERIFICATION_TOKEN = 'verificationToken',
  USER_SESSION = 'userSession',
  ACTIVITY = 'activity',
}

export class DomainEventAggregateType extends ValueObject<ValidDomainEventAggregateTypes> {
  private __domainEventAggregateTypeBrand: void

  private constructor(value: ValidDomainEventAggregateTypes) {
    super(value)

    if (!this.isValidDomainEventAggregateType(value)) {
      throw DomainEventDomainException.invalidDomainEventAggregateType(value)
    }
  }

  static fromString(value: string): DomainEventAggregateType {
    return new DomainEventAggregateType(value as ValidDomainEventAggregateTypes)
  }

  static user(): DomainEventAggregateType {
    return new DomainEventAggregateType(ValidDomainEventAggregateTypes.USER)
  }

  static verificationToken(): DomainEventAggregateType {
    return new DomainEventAggregateType(ValidDomainEventAggregateTypes.VERIFICATION_TOKEN)
  }

  static userSession(): DomainEventAggregateType {
    return new DomainEventAggregateType(ValidDomainEventAggregateTypes.USER_SESSION)
  }

  static activity(): DomainEventAggregateType {
    return new DomainEventAggregateType(ValidDomainEventAggregateTypes.ACTIVITY)
  }

  private isValidDomainEventAggregateType(value: string): boolean {
    return Object.values(ValidDomainEventAggregateTypes).includes(value as ValidDomainEventAggregateTypes)
  }
}
