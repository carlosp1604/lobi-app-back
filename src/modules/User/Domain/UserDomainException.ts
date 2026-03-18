import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { ValidUserRoles } from '~/src/modules/User/Domain/ValueObject/UserRole'

export class UserDomainException extends DomainException {
  public readonly __brand = 'UserDomainException' as const

  public static invalidUsernameId = 'user_domain_invalid_user_username'
  public static invalidUserNameId = 'user_domain_invalid_user_user_name'
  public static invalidUserStatusId = 'user_domain_invalid_user_status'
  public static invalidUserRoleId = 'user_domain_invalid_user_role'

  private constructor(message: string, id: string) {
    super(message, id, UserDomainException.name)
  }

  public static invalidUsername() {
    const message = [
      'Invalid username format:',
      '- Must be between 6 and 32 characters long.',
      '- Can only contain letters, numbers, underscores (_), and periods (.).',
      '- Cannot start or end with an underscore or period.',
      '- Cannot contain consecutive underscores or periods.',
    ].join('\n')

    return new UserDomainException(message, this.invalidUsernameId)
  }

  public static invalidUserName() {
    const message = [
      'Invalid user name format:',
      '- Must be between 2 and 255 characters long.',
      // eslint-disable-next-line quotes
      "- Can only contain letters, spaces, hyphens (-), and apostrophes (').",
    ].join('\n')

    return new UserDomainException(message, this.invalidUserNameId)
  }

  public static invalidUserStatus(userStatus: string) {
    return new UserDomainException(`${userStatus} is not a valid User status`, this.invalidUserStatusId)
  }

  public static invalidUserRole() {
    const validRolesList = Object.values(ValidUserRoles)
      .map((role) => `- ${role}`)
      .join('\n')

    const message = ['Invalid user role. Must be one of the following:', validRolesList].join('\n')

    return new UserDomainException(message, this.invalidUserRoleId)
  }
}
