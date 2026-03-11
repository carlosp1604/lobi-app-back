import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export class UserPassword extends ValueObject<string> {
  private __userPasswordBrand: void

  public static readonly MIN_LENGTH: number = 8
  public static readonly MAX_LENGTH: number = 128
  public static readonly REGEX = new RegExp(
    `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{${UserPassword.MIN_LENGTH},${UserPassword.MAX_LENGTH}}$`,
  )

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): UserPassword {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<UserPassword, UserCredentialDomainException> {
    if (!UserPassword.isValid(value)) {
      return fail(UserCredentialDomainException.invalidPasswordFormat())
    }

    return success(new UserPassword(value))
  }

  private static isValid(value: string): boolean {
    return UserPassword.REGEX.test(value)
  }
}
