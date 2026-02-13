import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenEmail extends EmailAddressValueObject {
  private __verificationTokenEmailBrand: void

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): VerificationTokenEmail {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<VerificationTokenEmail, VerificationTokenDomainException> {
    const normalized = value.trim()

    if (!EmailAddressValueObject.isValidEmail(normalized)) {
      return fail(VerificationTokenDomainException.invalidVerificationTokenEmail(normalized))
    }

    return success(new VerificationTokenEmail(normalized))
  }
}
