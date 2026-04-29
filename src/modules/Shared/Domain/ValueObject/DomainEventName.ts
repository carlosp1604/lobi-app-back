import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

export enum ValidDomainEventNames {
  SUCCESSFUL_LOGIN = 'successfulLogin',
  FAILED_LOGIN_ATTEMPT = 'failedLoginAttempt',
  EMAIL_VERIFICATION_REQUEST = 'emailVerificationRequest',
  SUCCESSFUL_SIGNUP = 'successfulSignup',
  SUCCESSFUL_RESET_PASSWORD = 'successfulResetPassword',
  CLOSED_SESSION = 'closedSession',
  ACTIVITY_CREATED = 'activityCreated',
}

export class DomainEventName extends ValueObject<ValidDomainEventNames> {
  private __domainEventNameBrand: void

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

  static emailVerificationRequest(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.EMAIL_VERIFICATION_REQUEST)
  }

  static successfulSignup(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.SUCCESSFUL_SIGNUP)
  }

  static successfulResetPassword(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.SUCCESSFUL_RESET_PASSWORD)
  }

  static closedSession(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.CLOSED_SESSION)
  }

  static activityCreated(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.ACTIVITY_CREATED)
  }

  private isValidDomainEventName(value: string): boolean {
    return Object.values(ValidDomainEventNames).includes(value as ValidDomainEventNames)
  }
}
