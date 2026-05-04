import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'

export class ActivityTitleMother {
  private static VALID_STRING = 'A valid activity title ⚽'
  private static TOO_SHORT_STRING = ''
  private static TOO_LONG_STRING = 'a'.repeat(ActivityTitle.MAX_LENGTH + 1)

  public static valid(): ActivityTitle {
    return ActivityTitle.fromString(this.VALID_STRING)
  }

  public static validString(): string {
    return this.VALID_STRING
  }

  public static tooShort(): string {
    return this.TOO_SHORT_STRING
  }

  public static tooLong(): string {
    return this.TOO_LONG_STRING
  }
}
