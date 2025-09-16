import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserCredentialDomainException extends DomainException {
  public static invalidPasswordHashId = 'user_credential_invalid_password'

  private constructor(message: string, id: string) {
    super(message, id, UserCredentialDomainException.name)
  }

  public static invalidPasswordHash() {
    return new UserCredentialDomainException('Invalid password hash format', this.invalidPasswordHashId)
  }
}
