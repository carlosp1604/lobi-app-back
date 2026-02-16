import { UserRole, ValidUserRoles } from '~/src/modules/User/Domain/ValueObject/UserRole'

export class UserRoleMother {
  public static readonly INVALID_ROLES = ['', 'random-role', '1111', 'ADMINISTRATOR', 'ADMin', 'admin ', 'superuser']
  public static readonly VALID_ROLES: Array<ValidUserRoles> = Object.values(ValidUserRoles)

  public static invalid(): string {
    return 'invalid-user-role'
  }

  static sportsman(): UserRole {
    return UserRole.sportsman()
  }

  static owner(): UserRole {
    return UserRole.owner()
  }
}
