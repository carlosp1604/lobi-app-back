import { CredentialHashValueObject } from '~/src/modules/Shared/Domain/ValueObject/CredentialHashValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenTokenHash extends CredentialHashValueObject {
  private __verificationTokenTokenHashBrand: void

  private constructor(value: string) {
    super(value)

    if (!this.isValid(value)) {
      throw VerificationTokenDomainException.invalidTokenHash()
    }
  }

  static fromString(value: string): VerificationTokenTokenHash {
    return new VerificationTokenTokenHash(value)
  }
}
