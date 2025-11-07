import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

export class UserEmail extends EmailAddressValueObject {
  private __userEmailBrand: void

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
}
