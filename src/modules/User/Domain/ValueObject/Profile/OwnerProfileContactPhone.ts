import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class OwnerProfileContactPhone extends ValueObject<string> {
  private __ownerProfileContactPhoneBrand: void

  public static readonly REGEX = /^\+[1-9]\d{6,14}$/

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): OwnerProfileContactPhone {
    const result = this.safeCreate(value)
    if (!result.success) throw result.error
    return result.value
  }

  static safeCreate(value: string): Result<OwnerProfileContactPhone, ProfileDomainException> {
    const cleaned = value.replace(/[\s\-.]/g, '')

    if (!this.REGEX.test(cleaned)) {
      return fail(ProfileDomainException.invalidOwnerContactPhone(value))
    }

    return success(new OwnerProfileContactPhone(cleaned))
  }
}
