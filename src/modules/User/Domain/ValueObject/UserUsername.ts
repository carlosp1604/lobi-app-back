import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

export class UserUsername extends ValueObject<string> {
  private __userUsernameBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidUsername(normalized)) {
      throw UserDomainException.invalidUsername(value)
    }
  }

  static fromString(value: string): UserUsername {
    return new UserUsername(value)
  }

  private isValidUsername(value: string): boolean {
    const usernameRegex = /^(?=.{6,32}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
    return usernameRegex.test(value)
  }
}
