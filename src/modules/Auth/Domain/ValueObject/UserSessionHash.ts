import { HashValueObject } from '~/src/modules/Shared/Domain/HashValueObject'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export class UserSessionHash extends HashValueObject {
  private constructor(value: string) {
    super(value)

    if (!this.isValidHash(value)) {
      throw UserSessionDomainException.invalidUserSessionHash()
    }
  }

  static fromString(value: string): UserSessionHash {
    return new UserSessionHash(value)
  }
}
