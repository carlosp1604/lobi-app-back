import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export enum ValidActivityStatus {
  OPEN = 'open',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FINISHED = 'finished',
}

export class ActivityStatus extends ValueObject<ValidActivityStatus> implements SerializableInterface<string> {
  private __activityStatusBrand: void

  private constructor(value: ValidActivityStatus) {
    super(value)

    if (!this.isValidStatus(value)) {
      throw ActivityDomainException.invalidActivityStatus(value, Object.values(ValidActivityStatus))
    }
  }

  static open(): ActivityStatus {
    return new ActivityStatus(ValidActivityStatus.OPEN)
  }

  static confirmed(): ActivityStatus {
    return new ActivityStatus(ValidActivityStatus.CONFIRMED)
  }

  static cancelled(): ActivityStatus {
    return new ActivityStatus(ValidActivityStatus.CANCELLED)
  }

  static finished(): ActivityStatus {
    return new ActivityStatus(ValidActivityStatus.FINISHED)
  }

  static fromString(value: string): ActivityStatus {
    return new ActivityStatus(value as ValidActivityStatus)
  }

  public isOpen(): boolean {
    return this.value === ValidActivityStatus.OPEN
  }

  public isConfirmed(): boolean {
    return this.value === ValidActivityStatus.CONFIRMED
  }

  private isValidStatus(value: string): boolean {
    return Object.values(ValidActivityStatus).includes(value as ValidActivityStatus)
  }

  public toPrimitives(): string {
    return this._value
  }
}
