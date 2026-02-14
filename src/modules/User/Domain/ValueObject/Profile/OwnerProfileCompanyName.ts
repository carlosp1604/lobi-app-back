import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class OwnerProfileCompanyName extends ValueObject<string> {
  private __ownerProfileCompanyNameBrand: void

  public static readonly MIN_LENGTH = 1
  public static readonly MAX_LENGTH = 100
  public static readonly INVALID_CHARS_REGEX = /[^\p{L}\p{N} .,&'-]/gu

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): OwnerProfileCompanyName {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<OwnerProfileCompanyName, ProfileDomainException> {
    const sanitized = value.replace(this.INVALID_CHARS_REGEX, '')

    const normalized = sanitized.trim()

    if (normalized.length < this.MIN_LENGTH || normalized.length > this.MAX_LENGTH) {
      return fail(ProfileDomainException.invalidOwnerCompanyName(value))
    }

    return success(new OwnerProfileCompanyName(normalized))
  }
}
