import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { HashValueObject } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'

export class UserSessionIpHash extends HashValueObject {
  private __userSessionIpHashBrand: void

  private constructor(value: string) {
    super(value)

    if (!this.isValidHash(value)) {
      throw UserSessionDomainException.invalidUserSessionIpHash()
    }
  }

  static fromString(value: string): UserSessionIpHash {
    return new UserSessionIpHash(value)
  }
}
