import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

export enum ValidDomainEventNames {
  SUCCESSFUL_LOGIN = 'successFulLogin',
  FAILED_LOGIN_ATTEMPT = 'failedLoginAttempt',
  LOCKED_LOGIN = 'lockedLogin',
}

export class DomainEventName extends ValueObject<ValidDomainEventNames> {
  private constructor(value: ValidDomainEventNames) {
    super(value)

    if (!this.isValidDomainEventName(value)) {
      throw DomainEventDomainException.invalidDomainEventName(value)
    }
  }

  static fromString(value: string): DomainEventName {
    return new DomainEventName(value as ValidDomainEventNames)
  }

  static successfulLogin(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.SUCCESSFUL_LOGIN)
  }

  static failedLoginAttempt(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.FAILED_LOGIN_ATTEMPT)
  }

  static lockedLogin(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.LOCKED_LOGIN)
  }

  private isValidDomainEventName(value: string): boolean {
    return Object.values(ValidDomainEventNames).includes(value as ValidDomainEventNames)
  }
}
