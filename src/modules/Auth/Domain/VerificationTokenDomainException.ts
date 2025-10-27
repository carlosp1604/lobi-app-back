import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class VerificationTokenDomainException extends DomainException {
  public static invalidVerificationTokenIdId = 'verification_token_invalid_verification_token_id'
  public static invalidVerificationTokenTokenHashId = 'verification_token_invalid_verification_token_token_hash'
  public static invalidVerificationTokenTypeId = 'verification_token_invalid_verification_token_type'

  private constructor(message: string, id: string) {
    super(message, id, VerificationTokenDomainException.name)
  }

  public static invalidVerificationTokenId(verificationTokenId: string) {
    return new VerificationTokenDomainException(
      `${verificationTokenId} is not a valid VerificationToken ID`,
      this.invalidVerificationTokenIdId,
    )
  }

  public static invalidTokenHash() {
    return new VerificationTokenDomainException('Invalid VerificationToken token hash format', this.invalidVerificationTokenTokenHashId)
  }

  public static invalidVerificationTokenType(type: string) {
    return new VerificationTokenDomainException(`${type} is not a valid VerificationToken type`, this.invalidVerificationTokenTypeId)
  }
}
