import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

export class UserName extends ValueObject<string> {
  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidName(normalized)) {
      throw UserDomainException.invalidUserName(value)
    }
  }

  static fromString(value: string): UserName {
    return new UserName(value)
  }

  private isValidName(value: string): boolean {
    const userNameRegex = /^[\p{L} \-']{2,255}$/u

    return userNameRegex.test(value)
  }
}
