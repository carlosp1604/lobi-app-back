import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserDomainException extends DomainException {
  public static invalidUsernameId = 'user_domain_invalid_user_username'
  public static invalidUserNameId = 'user_domain_invalid_user_user_name'
  public static invalidUserStatusId = 'user_domain_invalid_user_status'
  public static invalidUserRoleId = 'user_domain_invalid_user_role'

  private constructor(message: string, id: string) {
    super(message, id, UserDomainException.name)
  }

  public static invalidUsername(username: string) {
    return new UserDomainException(`${username} is not a valid User username`, this.invalidUsernameId)
  }

  public static invalidUserName(userName: string) {
    return new UserDomainException(`${userName} is not a valid User name`, this.invalidUserNameId)
  }

  public static invalidUserStatus(userStatus: string) {
    return new UserDomainException(`${userStatus} is not a valid User status`, this.invalidUserStatusId)
  }

  public static invalidUserRole(userRole: string) {
    return new UserDomainException(`${userRole} is not a valid User role`, this.invalidUserRoleId)
  }
}
