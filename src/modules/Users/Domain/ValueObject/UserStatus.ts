import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export enum ValidStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
}

export class UserStatus extends ValueObject<ValidStatus> {
  private constructor(value: ValidStatus) {
    super(value)

    if (!this.isValidUserStatus(value)) {
      throw UserDomainException.invalidUserStatus(value)
    }
  }

  static active(): UserStatus {
    return new UserStatus(ValidStatus.ACTIVE)
  }

  static fromString(value: string): UserStatus {
    return new UserStatus(value as ValidStatus)
  }

  private isValidUserStatus(value: string): boolean {
    return Object.values(ValidStatus).includes(value as ValidStatus)
  }
}
