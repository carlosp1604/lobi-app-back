import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export class UserName extends ValueObject<string> {
  private constructor(value: string) {
    super(value)

    if (!this.isValidName(value)) {
      throw UserDomainException.invalidUserName(value)
    }
  }

  static fromString(value: string): UserName {
    return new UserName(value)
  }

  private isValidName(value: string): boolean {
    return value.length >= 1 && value.length <= 255
  }
}
