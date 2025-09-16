import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/ValueObject/UserCredentialDomainException'

export class PasswordHash extends ValueObject<string> {
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
    const hashRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

    if (!value) {
      return false
    }

    if (value.length > 255) {
      return false
    }

    if (/\s/.test(value)) {
      return false
    }

    return hashRegex.test(value)
  }
}
