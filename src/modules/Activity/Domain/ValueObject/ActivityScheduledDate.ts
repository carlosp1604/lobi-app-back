import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export class ActivityScheduledDate extends ValueObject<Date> implements SerializableInterface<Date> {
  private __activityScheduledDateBrand: void

  public static readonly MIN_MARGIN_MINUTES = 90
  public static readonly MAX_FUTURE_DAYS = 30
  public static readonly JOIN_TOLERANCE_MINUTES = 10
  public static readonly LEAVE_TOLERANCE_MINUTES = 60

  private constructor(value: Date) {
    super(value)
  }

  public static safeCreate(date: Date): Result<ActivityScheduledDate, ActivityDomainException> {
    if (isNaN(date.getTime())) {
      return fail(ActivityDomainException.invalidActivityScheduledDate())
    }

    return success(new ActivityScheduledDate(date))
  }

  public static fromDate(date: Date): ActivityScheduledDate {
    const scheduledDateResult = this.safeCreate(date)

    if (!scheduledDateResult.success) {
      throw scheduledDateResult.error
    }

    return scheduledDateResult.value
  }

  public validate(now: Date): Result<void, ActivityDomainException> {
    const diffMs = this.value.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffMinutes < ActivityScheduledDate.MIN_MARGIN_MINUTES || diffDays > ActivityScheduledDate.MAX_FUTURE_DAYS) {
      return fail(
        ActivityDomainException.scheduledDateOutOfRange(
          this.value.toISOString(),
          ActivityScheduledDate.MIN_MARGIN_MINUTES,
          ActivityScheduledDate.MAX_FUTURE_DAYS,
        ),
      )
    }

    return success(undefined)
  }

  public get value(): Date {
    return new Date(this._value.getTime())
  }

  public equals(vo?: ActivityScheduledDate | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.getTime() === vo.value.getTime()
  }

  public toString(): string {
    return this._value.toISOString()
  }

  public toPrimitives(): Date {
    return this._value
  }

  public isPastStartTime(now: Date): boolean {
    return now.getTime() >= this._value.getTime()
  }

  public isPastJoinTolerance(now: Date): boolean {
    const expirationTimeMs = this._value.getTime() + ActivityScheduledDate.JOIN_TOLERANCE_MINUTES * 60 * 1000
    return now.getTime() > expirationTimeMs
  }

  public isPastLeaveMargin(now: Date): boolean {
    const expirationTimeMs = this._value.getTime() - ActivityScheduledDate.LEAVE_TOLERANCE_MINUTES * 60 * 1000
    return now.getTime() > expirationTimeMs
  }
}
