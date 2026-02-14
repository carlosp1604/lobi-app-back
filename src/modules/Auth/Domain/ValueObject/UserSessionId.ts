import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'

export class UserSessionId extends UuidValueObject {
  private __userSessionIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!UuidValueObject.isValidId(normalized)) {
      throw UserSessionDomainException.invalidUserSessionId(value)
    }
  }

  static fromString(value: string): UserSessionId {
    return new UserSessionId(value)
  }
}
