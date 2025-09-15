import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'
import { UserDomainException } from '~/src/modules/Auth/Domain/UserDomainException'

export class UserEmail extends ValueObject<string> {
  private constructor(value: string) {
    super(value)

    if (!this.isValidEmail(value)) {
      throw UserDomainException.invalidUserEmail(value)
    }
  }

  static fromString(value: string): UserEmail {
    return new UserEmail(value)
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }
}
