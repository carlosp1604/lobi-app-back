import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export enum ValidRoles {
  SPORTMAN = 'sportman',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export class UserRole extends ValueObject<ValidRoles> {
  private constructor(value: ValidRoles) {
    super(value)

    if (!this.isValidUserRole(value)) {
      throw UserDomainException.invalidUserRole(value)
    }
  }

  static fromString(value: string): UserRole {
    return new UserRole(value as ValidRoles)
  }

  private isValidUserRole(value: string): boolean {
    return Object.values(ValidRoles).includes(value as ValidRoles)
  }
}
