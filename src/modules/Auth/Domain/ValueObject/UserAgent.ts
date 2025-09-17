import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export class UserAgent extends ValueObject<string> {
  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValid(normalized)) {
      throw UserSessionDomainException.invalidUserAgent(normalized)
    }
  }

  static fromString(value: string): UserAgent {
    return new UserAgent(value)
  }

  private isValid(v: string): boolean {
    if (!v || v.length > 512) {
      return false
    }

    if (/[^\x20-\x7E]/.test(v)) {
      return false
    }

    return true
  }
}
