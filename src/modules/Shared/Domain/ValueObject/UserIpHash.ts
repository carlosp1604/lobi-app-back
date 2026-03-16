import { HashValueObject } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class UserIpHash extends HashValueObject {
  private __userSessionIpHashBrand: void

  private constructor(value: string) {
    super(value)

    if (!this.isValidHash(value)) {
      throw SharedDomainException.invalidUserIpHash()
    }
  }

  static fromString(value: string): UserIpHash {
    return new UserIpHash(value)
  }
}
