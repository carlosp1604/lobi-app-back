import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'

export class UserId extends UuidValueObject {
  private __userIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!UuidValueObject.isValidId(normalized)) {
      throw UserDomainException.invalidUserId(value)
    }
  }

  static fromString(value: string): UserId {
    return new UserId(value)
  }
}
