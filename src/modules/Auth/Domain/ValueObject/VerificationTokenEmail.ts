import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenEmail extends EmailAddressValueObject {
  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidEmail(normalized)) {
      throw VerificationTokenDomainException.invalidVerificationTokenEmail(value)
    }
  }

  static fromString(value: string): VerificationTokenEmail {
    return new VerificationTokenEmail(value)
  }
}
