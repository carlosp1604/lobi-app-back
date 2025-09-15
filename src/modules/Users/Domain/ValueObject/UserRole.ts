import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export enum ValidUserRoles {
  SPORTMAN = 'sportman',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export class UserRole extends ValueObject<ValidUserRoles> {
  private constructor(value: ValidUserRoles) {
    super(value)

    if (!this.isValidUserRole(value)) {
      throw UserDomainException.invalidUserRole(value)
    }
  }

  static fromString(value: string): UserRole {
    return new UserRole(value as ValidUserRoles)
  }

  private isValidUserRole(value: string): boolean {
    return Object.values(ValidUserRoles).includes(value as ValidUserRoles)
  }
}
