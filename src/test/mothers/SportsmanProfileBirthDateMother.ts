import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'

export class SportsmanProfileBirthDateMother {
  public static readonly INVALID_STRING_FORMAT_CASES = ['invalid-date', '2024-15-40', 'not-a-date', '']

  public static readonly INVALID_DATE_FORMAT_CASES = [new Date('invalid'), new Date(NaN)]

  static valid(now: Date): SportsmanProfileBirthDate {
    const safeYear = now.getFullYear() - 30
    const month = now.getMonth()
    const day = now.getDate()

    const date = new Date(safeYear, month, day)

    return SportsmanProfileBirthDate.fromDate(date, now)
  }

  static randomDate(now: Date): Date {
    const minYear = now.getFullYear() - SportsmanProfileBirthDate.MAX_AGE_YEARS + 1
    const maxYear = now.getFullYear() - 1

    const randomYear = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear
    const randomMonth = Math.floor(Math.random() * 12)
    const randomDay = Math.floor(Math.random() * 28) + 1

    return new Date(randomYear, randomMonth, randomDay)
  }

  static random(now: Date): SportsmanProfileBirthDate {
    return SportsmanProfileBirthDate.fromDate(this.randomDate(now), now)
  }

  static randomString(now: Date): string {
    const date = this.randomDate(now)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  static futureDate(now: Date): Date {
    const date = new Date(now.getTime())
    date.setDate(date.getDate() + 10) // 10 días en el futuro
    return date
  }

  static tooOldDate(now: Date): Date {
    const date = new Date(now.getTime())
    date.setFullYear(now.getFullYear() - (SportsmanProfileBirthDate.MAX_AGE_YEARS + 1))
    return date
  }
}
