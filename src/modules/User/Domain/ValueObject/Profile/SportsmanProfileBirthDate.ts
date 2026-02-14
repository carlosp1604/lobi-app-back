import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

export class SportsmanProfileBirthDate extends ValueObject<Date> {
  private __sportsmanProfileBirthDateBrand: void

  public static readonly MAX_AGE_YEARS = 125

  private constructor(value: Date) {
    super(value)
  }

  static fromString(value: string, now: Date): SportsmanProfileBirthDate {
    const result = this.safeCreate(value, now)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static fromDate(value: Date, now: Date): SportsmanProfileBirthDate {
    const result = this.safeCreate(value, now)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string | Date, now: Date): Result<SportsmanProfileBirthDate, ProfileDomainException> {
    const dateValue = typeof value === 'string' ? new Date(value) : value

    if (isNaN(dateValue.getTime())) {
      return fail(ProfileDomainException.invalidSportsmanBirthDate(dateValue))
    }

    const birthDateNormalized = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate())
    const nowNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (birthDateNormalized.getTime() > nowNormalized.getTime()) {
      return fail(ProfileDomainException.sportsmanBirthDateInFuture())
    }

    const age = nowNormalized.getFullYear() - birthDateNormalized.getFullYear()
    if (age > this.MAX_AGE_YEARS) {
      return fail(ProfileDomainException.sportsmanBirthDateTooOld(this.MAX_AGE_YEARS))
    }

    return success(new SportsmanProfileBirthDate(birthDateNormalized))
  }

  public toISODate(): string {
    const year = this.value.getFullYear()
    const month = String(this.value.getMonth() + 1).padStart(2, '0')
    const day = String(this.value.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
}
