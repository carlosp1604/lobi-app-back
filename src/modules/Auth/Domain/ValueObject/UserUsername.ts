import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'
import { UserDomainException } from '~/src/modules/Auth/Domain/UserDomainException'

export class UserUsername extends ValueObject<string> {
  private constructor(value: string) {
    super(value)

    if (!this.isValidUsername(value)) {
      throw UserDomainException.invalidUsername(value)
    }
  }

  static fromString(value: string): UserUsername {
    return new UserUsername(value)
  }

  private isValidUsername(value: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9._]{4,32}$/
    return usernameRegex.test(value)
  }
}
