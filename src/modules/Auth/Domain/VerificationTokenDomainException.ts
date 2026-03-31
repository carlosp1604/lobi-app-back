import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { ValidVerificationTokenPurposes } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'

export class VerificationTokenDomainException extends DomainException {
  public readonly __brand = 'VerificationTokenDomainException' as const

  public static invalidVerificationTokenValueId = 'verification_token_domain_invalid_verification_token_value'
  public static invalidVerificationTokenTokenHashId = 'verification_token_domain_invalid_verification_token_token_hash'
  public static invalidVerificationTokenPurposeId = 'verification_token_domain_invalid_verification_token_purpose'
  public static verificationTokenAlreadyUsedId = 'verification_token_domain_verification_token_already_used'
  public static verificationTokenAlreadyExpiredId = 'verification_token_domain_verification_token_already_expired'
  public static verificationTokenCannotBeUsedForPurposeId = 'verification_token_domain_verification_token_cannot_be_used_for_purpose'
  public static verificationTokenCannotBeUsedByUserId = 'verification_token_domain_verification_token_cannot_be_used_by_user'

  private constructor(message: string, id: string) {
    super(message, id, VerificationTokenDomainException.name)
  }

  public static invalidVerificationTokenValue() {
    const message = [
      'Invalid verification token format:',
      '- Must be exactly 8 characters long.',
      '- Must contain only numeric characters (0-9).',
    ].join('\n')

    return new VerificationTokenDomainException(message, this.invalidVerificationTokenValueId)
  }

  public static invalidTokenHash() {
    return new VerificationTokenDomainException('Invalid VerificationToken token hash format', this.invalidVerificationTokenTokenHashId)
  }

  public static invalidVerificationTokenPurpose() {
    const validPurposesList = Object.values(ValidVerificationTokenPurposes)
      .map((purpose) => `- ${purpose}`)
      .join('\n')

    const message = ['Invalid verification token purpose. Must be one of the following:', validPurposesList].join('\n')

    return new VerificationTokenDomainException(message, this.invalidVerificationTokenPurposeId)
  }

  public static alreadyUsed() {
    return new VerificationTokenDomainException('The verification token has already been used', this.verificationTokenAlreadyUsedId)
  }

  public static alreadyExpired() {
    return new VerificationTokenDomainException('The verification token has expired', this.verificationTokenAlreadyExpiredId)
  }

  public static cannotBeUsedForPurpose() {
    return new VerificationTokenDomainException(
      'The verification token cannot be used for the requested action',
      this.verificationTokenCannotBeUsedForPurposeId,
    )
  }

  public static cannotBeUsedByUser(email: string) {
    return new VerificationTokenDomainException(
      `The verification token does not belong to the email address ${email}.`,
      this.verificationTokenCannotBeUsedByUserId,
    )
  }
}
