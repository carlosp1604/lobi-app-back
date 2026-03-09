import {
  ValidVerificationTokenPurposes,
  VerificationTokenPurpose,
} from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'

export class VerificationTokenPurposeMother {
  public static readonly INVALID_PURPOSES = ['', 'random-purpose', '2222', 'remove-account', 'create-account', 'change-password']
  public static readonly VALID_PURPOSES: Array<ValidVerificationTokenPurposes> = Object.values(ValidVerificationTokenPurposes)

  public static invalid(): string {
    return 'invalid-verification-token-purpose'
  }

  static createAccount(): VerificationTokenPurpose {
    return VerificationTokenPurpose.createAccount()
  }

  static resetPassword(): VerificationTokenPurpose {
    return VerificationTokenPurpose.resetPassword()
  }
}
