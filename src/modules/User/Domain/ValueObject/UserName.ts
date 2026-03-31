import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export class UserName extends ValueObject<string> {
  private __userNameBrand: void

  public static readonly REGEX = /^[\p{L} \-']{2,255}$/u

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): UserName {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<UserName, UserDomainException> {
    const normalized = value.trim()

    if (!UserName.isValidName(normalized)) {
      return fail(UserDomainException.invalidUserName())
    }

    return success(new UserName(normalized))
  }

  private static isValidName(value: string): boolean {
    return this.REGEX.test(value)
  }
}
