import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class SportsmanProfileBio extends ValueObject<string> {
  private __sportsmanProfileBio: void

  public static readonly MIN_LENGTH = 1
  public static readonly MAX_LENGTH = 256
  public static readonly REGEX = new RegExp(`^[\\s\\S]{${SportsmanProfileBio.MIN_LENGTH},${SportsmanProfileBio.MAX_LENGTH}}$`)

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): SportsmanProfileBio {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<SportsmanProfileBio, ProfileDomainException> {
    const normalized = value.trim()

    if (!SportsmanProfileBio.isValidBio(normalized)) {
      return fail(ProfileDomainException.invalidSportsmanBio(value))
    }

    return success(new SportsmanProfileBio(normalized))
  }

  private static isValidBio(value: string): boolean {
    return this.REGEX.test(value)
  }
}
