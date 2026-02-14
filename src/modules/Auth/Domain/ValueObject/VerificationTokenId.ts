import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenId extends UuidValueObject {
  private __verificationTokenIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!UuidValueObject.isValidId(normalized)) {
      throw VerificationTokenDomainException.invalidVerificationTokenId(value)
    }
  }

  static fromString(value: string): VerificationTokenId {
    return new VerificationTokenId(value)
  }
}
