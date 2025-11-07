import { HashValueObject } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenTokenHash extends HashValueObject {
  private __verificationTokenTokenHashBrand: void

  private constructor(value: string) {
    super(value)

    if (!this.isValidHash(value)) {
      throw VerificationTokenDomainException.invalidTokenHash()
    }
  }

  static fromString(value: string): VerificationTokenTokenHash {
    return new VerificationTokenTokenHash(value)
  }
}
