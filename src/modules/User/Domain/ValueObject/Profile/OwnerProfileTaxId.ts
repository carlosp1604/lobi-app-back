import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class OwnerProfileTaxId extends ValueObject<string> {
  private __ownerProfileTaxIdBrand: void

  public static readonly MIN_LENGTH = 5
  public static readonly MAX_LENGTH = 50
  public static readonly REGEX = /^[A-Z0-9]+$/

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): OwnerProfileTaxId {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  // TODO: Implement Strategy Pattern based on CountryID when is supported
  static safeCreate(value: string): Result<OwnerProfileTaxId, ProfileDomainException> {
    const normalized = value.replace(new RegExp('[\\s._/-]', 'g'), '').toUpperCase()

    if (!this.REGEX.test(normalized)) {
      return fail(ProfileDomainException.invalidOwnerTaxId(value))
    }

    if (normalized.length < this.MIN_LENGTH || normalized.length > this.MAX_LENGTH) {
      return fail(ProfileDomainException.invalidOwnerTaxId(value))
    }

    return success(new OwnerProfileTaxId(normalized))
  }
}
