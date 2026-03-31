import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export class UserUsername extends ValueObject<string> {
  private __userUsernameBrand: void

  public static readonly REGEX = /^(?=.{6,32}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): UserUsername {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<UserUsername, UserDomainException> {
    const normalized = value.trim()

    if (!UserUsername.isValidUsername(normalized)) {
      return fail(UserDomainException.invalidUsername())
    }

    return success(new UserUsername(normalized))
  }

  private static isValidUsername(value: string): boolean {
    return this.REGEX.test(value)
  }
}
