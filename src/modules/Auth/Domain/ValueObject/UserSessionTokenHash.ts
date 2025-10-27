import { HashValueObject } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export class UserSessionTokenHash extends HashValueObject {
  private constructor(value: string) {
    super(value)

    if (!this.isValidHash(value)) {
      throw UserSessionDomainException.invalidUserSessionTokenHash()
    }
  }

  static fromString(value: string): UserSessionTokenHash {
    return new UserSessionTokenHash(value)
  }
}
