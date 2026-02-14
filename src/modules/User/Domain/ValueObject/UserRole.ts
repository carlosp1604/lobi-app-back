import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export enum ValidUserRoles {
  SPORTSMAN = 'sportsman',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export class UserRole extends ValueObject<ValidUserRoles> {
  private __userRoleBrand: void

  private constructor(value: ValidUserRoles) {
    super(value)
  }

  static fromString(value: string): UserRole {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static sportsman(): UserRole {
    return new UserRole(ValidUserRoles.SPORTSMAN)
  }

  static owner(): UserRole {
    return new UserRole(ValidUserRoles.OWNER)
  }

  static safeCreate(value: string): Result<UserRole, UserDomainException> {
    if (!UserRole.isValidUserRole(value)) {
      return fail(UserDomainException.invalidUserRole(value))
    }

    return success(new UserRole(value as ValidUserRoles))
  }

  private static isValidUserRole(value: string): boolean {
    return Object.values(ValidUserRoles).includes(value as ValidUserRoles)
  }
}
