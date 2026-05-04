import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'

export class ActivityDescriptionMother {
  private static VALID_STRING = 'A valid activity description\nAnother line   . This is still valid 🐕'
  private static TOO_SHORT_STRING = ''
  private static TOO_LONG_STRING = 'a'.repeat(ActivityDescription.MAX_LENGTH + 1)

  public static valid(): ActivityDescription {
    return ActivityDescription.fromString(this.VALID_STRING)
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
