import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export enum ValidUserStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
}

export class UserStatus extends ValueObject<ValidUserStatus> {
  private constructor(value: ValidUserStatus) {
    super(value)

    if (!this.isValidUserStatus(value)) {
      throw UserDomainException.invalidUserStatus(value)
    }
  }

  static active(): UserStatus {
    return new UserStatus(ValidUserStatus.ACTIVE)
  }

  static fromString(value: string): UserStatus {
    return new UserStatus(value as ValidUserStatus)
  }

  private isValidUserStatus(value: string): boolean {
    return Object.values(ValidUserStatus).includes(value as ValidUserStatus)
  }
}
