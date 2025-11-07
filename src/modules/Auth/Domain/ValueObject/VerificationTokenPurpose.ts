import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export enum ValidVerificationTokenPurposes {
  CREATE_ACCOUNT = 'createAccount',
  RESET_PASSWORD = 'resetPassword',
}

export class VerificationTokenPurpose extends ValueObject<ValidVerificationTokenPurposes> {
  private __verificationTokenPurposeBrand: void

  private constructor(value: ValidVerificationTokenPurposes) {
    super(value)

    if (!this.isValidVerificationTokenPurpose(value)) {
      throw VerificationTokenDomainException.invalidVerificationTokenPurpose(value)
    }
  }

  static createAccount(): VerificationTokenPurpose {
    return new VerificationTokenPurpose(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
  }

  static resetPassword(): VerificationTokenPurpose {
    return new VerificationTokenPurpose(ValidVerificationTokenPurposes.RESET_PASSWORD)
  }

  static fromString(value: string): VerificationTokenPurpose {
    return new VerificationTokenPurpose(value as ValidVerificationTokenPurposes)
  }

  private isValidVerificationTokenPurpose(value: string): boolean {
    return Object.values(ValidVerificationTokenPurposes).includes(value as ValidVerificationTokenPurposes)
  }
}
