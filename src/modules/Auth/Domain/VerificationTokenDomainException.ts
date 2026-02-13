import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class VerificationTokenDomainException extends DomainException {
  public static invalidVerificationTokenIdId = 'verification_token_invalid_verification_token_id'
  public static invalidVerificationTokenValueId = 'verification_token_invalid_verification_token_value'
  public static invalidVerificationTokenTokenHashId = 'verification_token_invalid_verification_token_token_hash'
  public static invalidVerificationTokenPurposeId = 'verification_token_invalid_verification_token_purpose'
  public static invalidVerificationTokenEmailId = 'verification_token_invalid_verification_token_email'
  public static verificationTokenAlreadyUsedId = 'verification_token_verification_token_already_used'
  public static verificationTokenAlreadyExpiredId = 'verification_token_verification_token_already_expired'
  public static verificationTokenCannotBeUsedForPurposeId = 'verification_token_verification_token_cannot_be_used_for_purpose'
  public static verificationTokenCannotBeUsedByUserId = 'verification_token_verification_token_cannot_be_used_by_user'

  private constructor(message: string, id: string) {
    super(message, id, VerificationTokenDomainException.name)
  }

  public static invalidVerificationTokenId(verificationTokenId: string) {
    return new VerificationTokenDomainException(
      `${verificationTokenId} is not a valid VerificationToken ID`,
      this.invalidVerificationTokenIdId,
    )
  }

  public static invalidVerificationTokenValue(value: string) {
    const safeValueSample = StringFormatter.formatSafe(value, 20)
    return new VerificationTokenDomainException(
      `${safeValueSample} is not a valid VerificationToken value format`,
      this.invalidVerificationTokenValueId,
    )
  }

  public static invalidTokenHash() {
    return new VerificationTokenDomainException('Invalid VerificationToken token hash format', this.invalidVerificationTokenTokenHashId)
  }

  public static invalidVerificationTokenPurpose(purpose: string) {
    return new VerificationTokenDomainException(
      `${purpose} is not a valid VerificationToken purpose`,
      this.invalidVerificationTokenPurposeId,
    )
  }

  public static invalidVerificationTokenEmail(verificationTokenEmail: string) {
    return new VerificationTokenDomainException(
      `${verificationTokenEmail} is not a valid VerificationToken email`,
      this.invalidVerificationTokenEmailId,
    )
  }

  public static alreadyUsed(verificationTokenId: string) {
    return new VerificationTokenDomainException(
      `VerificationToken identified by ID ${verificationTokenId} is already used`,
      this.verificationTokenAlreadyUsedId,
    )
  }

  public static alreadyExpired(verificationTokenId: string) {
    return new VerificationTokenDomainException(
      `VerificationToken identified by ID ${verificationTokenId} is already expired`,
      this.verificationTokenAlreadyExpiredId,
    )
  }

  public static cannotBeUsedForPurpose(verificationTokenId: string, purpose: string) {
    return new VerificationTokenDomainException(
      `VerificationToken identified by ID ${verificationTokenId} cannot be used for purpose ${purpose}`,
      this.verificationTokenCannotBeUsedForPurposeId,
    )
  }

  public static cannotBeUsedByUser(verificationTokenId: string, email: string) {
    return new VerificationTokenDomainException(
      `VerificationToken identified by ID ${verificationTokenId} cannot be used by User email ${email}`,
      this.verificationTokenCannotBeUsedByUserId,
    )
  }
}
