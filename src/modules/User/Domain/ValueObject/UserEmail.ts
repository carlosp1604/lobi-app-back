import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

export class UserEmail extends ValueObject<string> {
  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidEmail(normalized)) {
      throw UserDomainException.invalidUserEmail(value)
    }
  }

  static fromString(value: string): UserEmail {
    return new UserEmail(value)
  }

  private isValidEmail(value: string): boolean {
    if (!value) {
      return false
    }

    if (value.length > 320) {
      return false
    }

    const parts = value.split('@')

    if (parts.length !== 2) {
      return false
    }

    const [local, domain] = parts
    if (!local || !domain) {
      return false
    }

    if (local.length > 64) {
      return false
    }

    return /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
  }
}
