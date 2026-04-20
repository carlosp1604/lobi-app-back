import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Duration'

export class DurationMother {
  public static readonly VALID_SECONDS = '3665'

  public static readonly INVALID_SECONDS = ['0', '-1', '-500', 'NaN', '259201']

  static valid(): Duration {
    return Duration.fromString(this.VALID_SECONDS)
  }
}
