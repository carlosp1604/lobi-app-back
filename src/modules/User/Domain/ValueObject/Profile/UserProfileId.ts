import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class UserProfileId extends UuidValueObject {
  private __userProfileIdBrand: void

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): UserProfileId {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<UserProfileId, UserDomainException> {
    const normalized = value.trim()

    if (!UuidValueObject.isValidId(normalized)) {
      return fail(ProfileDomainException.invalidUserProfileId(value))
    }

    return success(new UserProfileId(normalized))
  }
}
