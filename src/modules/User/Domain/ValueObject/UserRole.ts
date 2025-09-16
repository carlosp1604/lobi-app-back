import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export enum ValidUserRoles {
  SPORTSMAN = 'sportsman',
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

  static sportsman(): UserRole {
    return new UserRole(ValidUserRoles.SPORTSMAN)
  }

  static owner(): UserRole {
    return new UserRole(ValidUserRoles.OWNER)
  }

  private isValidUserRole(value: string): boolean {
    return Object.values(ValidUserRoles).includes(value as ValidUserRoles)
  }
}
