import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

export enum ValidVerificationTokenTypes {
  CREATE_ACCOUNT = 'createAccount',
  CHANGE_PASSWORD = 'changePassword',
}

export class VerificationTokenType extends ValueObject<ValidVerificationTokenTypes> {
  private constructor(value: ValidVerificationTokenTypes) {
    super(value)

    if (!this.isValidVerificationTokenType(value)) {
      throw VerificationTokenDomainException.invalidVerificationTokenType(value)
    }
  }

  static createAccount(): VerificationTokenType {
    return new VerificationTokenType(ValidVerificationTokenTypes.CREATE_ACCOUNT)
  }

  static changePassword(): VerificationTokenType {
    return new VerificationTokenType(ValidVerificationTokenTypes.CHANGE_PASSWORD)
  }

  static fromString(value: string): VerificationTokenType {
    return new VerificationTokenType(value as ValidVerificationTokenTypes)
  }

  private isValidVerificationTokenType(value: string): boolean {
    return Object.values(ValidVerificationTokenTypes).includes(value as ValidVerificationTokenTypes)
  }
}
