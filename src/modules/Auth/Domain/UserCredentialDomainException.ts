import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserCredentialDomainException extends DomainException {
  public static invalidPasswordHashFormatId = 'user_credential_domain_invalid_password_hash_format'
  public static invalidPasswordFormatId = 'user_credential_domain_invalid_password_format'

  private constructor(message: string, id: string) {
    super(message, id, UserCredentialDomainException.name)
  }

  public static invalidPasswordHashFormat() {
    return new UserCredentialDomainException('Invalid UserCredential password hash format', this.invalidPasswordHashFormatId)
  }

  public static invalidPasswordFormat() {
    const message = [
      'Password does not meet the security requirements:',
      '- Must be between 8 and 128 characters.',
      '- Must include at least one uppercase letter.',
      '- Must include at least one lowercase letter.',
      '- Must include at least one number.',
      '- Must include at least one special character.',
    ].join('\n')

    return new UserCredentialDomainException(message, this.invalidPasswordFormatId)
  }
}
