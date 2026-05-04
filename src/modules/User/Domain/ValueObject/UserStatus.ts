import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { ValidUserStatuses } from '~/src/modules/Shared/Domain/ValidUserStatuses'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

export class UserStatus extends ValueObject<ValidUserStatuses> {
  private __userStatusBrand: void

  private constructor(value: ValidUserStatuses) {
    super(value)

    if (!this.isValidUserStatus(value)) {
      throw UserDomainException.invalidUserStatus(value)
    }
  }

  static active(): UserStatus {
    return new UserStatus(ValidUserStatuses.ACTIVE)
  }

  static deactivated(): UserStatus {
    return new UserStatus(ValidUserStatuses.DEACTIVATED)
  }

  static fromString(value: string): UserStatus {
    return new UserStatus(value as ValidUserStatuses)
  }

  private isValidUserStatus(value: string): boolean {
    return Object.values(ValidUserStatuses).includes(value as ValidUserStatuses)
  }
}
