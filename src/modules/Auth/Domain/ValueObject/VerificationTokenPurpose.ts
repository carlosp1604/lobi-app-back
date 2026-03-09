import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export enum ValidVerificationTokenPurposes {
  CREATE_ACCOUNT = 'createAccount',
  RESET_PASSWORD = 'resetPassword',
}

export class VerificationTokenPurpose extends ValueObject<ValidVerificationTokenPurposes> {
  private __verificationTokenPurposeBrand: void

  private constructor(value: ValidVerificationTokenPurposes) {
    super(value)
  }

  static createAccount(): VerificationTokenPurpose {
    return new VerificationTokenPurpose(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
  }

  static resetPassword(): VerificationTokenPurpose {
    return new VerificationTokenPurpose(ValidVerificationTokenPurposes.RESET_PASSWORD)
  }

  static fromString(value: string): VerificationTokenPurpose {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<VerificationTokenPurpose, VerificationTokenDomainException> {
    if (!VerificationTokenPurpose.isValidVerificationTokenPurpose(value)) {
      return fail(VerificationTokenDomainException.invalidVerificationTokenPurpose(value))
    }

    return success(new VerificationTokenPurpose(value as ValidVerificationTokenPurposes))
  }

  private static isValidVerificationTokenPurpose(value: string): boolean {
    return Object.values(ValidVerificationTokenPurposes).includes(value as ValidVerificationTokenPurposes)
  }
}
