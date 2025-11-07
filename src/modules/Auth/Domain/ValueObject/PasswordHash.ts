import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

const BCRYPT_REGEX = /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/

export class PasswordHash extends ValueObject<string> {
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

  private isValid(value: string): boolean {
    if (!value) {
      return false
    }

    if (value.length > 255) {
      return false
    }

    if (/\s/.test(value)) {
      return false
    }

    return BCRYPT_REGEX.test(value)
  }
}
