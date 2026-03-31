import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export class VerificationTokenValue extends ValueObject<string> {
  private __verificationTokenTokenBrand: void

  public static readonly LENGTH = 8
  public static readonly REGEX = new RegExp(`^[0-9]{${this.LENGTH}}$`)

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): VerificationTokenValue {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<VerificationTokenValue, VerificationTokenDomainException> {
    if (!VerificationTokenValue.isValid(value)) {
      return fail(VerificationTokenDomainException.invalidVerificationTokenValue())
    }

    return success(new VerificationTokenValue(value))
  }

  private static isValid(value: string): boolean {
    return VerificationTokenValue.REGEX.test(value)
  }
}
