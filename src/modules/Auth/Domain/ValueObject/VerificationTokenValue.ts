import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export class VerificationTokenValue extends ValueObject<string> {
  private __verificationTokenTokenBrand: void

  public static readonly LENGTH = 8
  public static readonly REGEX: RegExp = new RegExp(`^[0-9]{${this.LENGTH}}$`)

  private constructor(value: string) {
    super(value)

    if (!this.isValid(value)) {
      throw VerificationTokenDomainException.invalidVerificationTokenValue(value)
    }
  }

  static fromString(value: string): VerificationTokenValue {
    return new VerificationTokenValue(value)
  }

  private isValid(value: string): boolean {
    return VerificationTokenValue.REGEX.test(value)
  }
}
