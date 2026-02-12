import { CredentialHashValueObject } from '~/src/modules/Shared/Domain/ValueObject/CredentialHashValueObject'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

export class PasswordHash extends CredentialHashValueObject {
  private __passwordHashBrand: void

  private constructor(value: string) {
    super(value)

    if (!this.isValid(value)) {
      throw UserCredentialDomainException.invalidPasswordHash()
    }
  }

  static fromString(value: string): PasswordHash {
    return new PasswordHash(value)
  }
}
