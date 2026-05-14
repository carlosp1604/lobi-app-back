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
  PARTICIPANT_JOINED = 'participantJoined',
  PARTICIPANT_LEFT = 'participantLeft',
  ACTIVITY_CONFIRMED = 'activityConfirmed',
  ACTIVITY_CANCELLED = 'activityCancelled',
  NEW_HOST = 'newHost',
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

  static participantJoined(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.PARTICIPANT_JOINED)
  }

  static participantLeft(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.PARTICIPANT_LEFT)
  }

  static activityConfirmed(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.ACTIVITY_CONFIRMED)
  }

  static activityCancelled(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.ACTIVITY_CANCELLED)
  }

  static newHost(): DomainEventName {
    return new DomainEventName(ValidDomainEventNames.NEW_HOST)
  }

  private isValidDomainEventName(value: string): boolean {
    return Object.values(ValidDomainEventNames).includes(value as ValidDomainEventNames)
  }
}
