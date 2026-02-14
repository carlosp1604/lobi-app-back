import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'

export class UserEmail extends EmailAddressValueObject {
  private __userEmailBrand: void

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): UserEmail {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<UserEmail, UserDomainException> {
    const normalized = value.trim()

    if (!EmailAddressValueObject.isValidEmail(normalized)) {
      return fail(UserDomainException.invalidUserEmail(value))
    }

    return success(new UserEmail(normalized))
  }
}
