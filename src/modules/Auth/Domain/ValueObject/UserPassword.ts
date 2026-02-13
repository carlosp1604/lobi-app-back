import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

export class UserPassword extends ValueObject<string> {
  private __userPasswordBrand: void

  public static readonly MIN_LENGTH: number = 8
  public static readonly MAX_LENGTH: number = 128
  public static readonly REGEX = new RegExp(
    `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{${UserPassword.MIN_LENGTH},${UserPassword.MAX_LENGTH}}$`,
  )

  private constructor(value: string) {
    super(value)

    if (!this.isValid(value)) {
      throw UserCredentialDomainException.invalidPasswordFormat()
    }
  }

  static fromString(value: string): UserPassword {
    return new UserPassword(value)
  }

  private isValid(value: string): boolean {
    return UserPassword.REGEX.test(value)
  }
}
