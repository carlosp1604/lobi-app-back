import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ActivityScheduledDate'

export class ActivityScheduledDateMother {
  public static valid(now: Date): ActivityScheduledDate {
    return ActivityScheduledDate.fromDate(this.validDate(now))
  }

  public static past(now: Date): ActivityScheduledDate {
    return ActivityScheduledDate.fromDate(this.pastDate(now))
  }

  public static future(now: Date): ActivityScheduledDate {
    return ActivityScheduledDate.fromDate(this.futureDate(now))
  }

  public static validDate(now: Date): Date {
    const scheduledForMillis = 3600 * 2 * 1000

    return new Date(now.getTime() + scheduledForMillis)
  }

  public static pastDate(now: Date): Date {
    const scheduledForMillis = (ActivityScheduledDate.MIN_MARGIN_MINUTES - 1) * 60 * 1000

    return new Date(now.getTime() + scheduledForMillis)
  }

  public static futureDate(now: Date): Date {
    const scheduledForMillis = (ActivityScheduledDate.MAX_FUTURE_DAYS + 1) * 86400 * 1000

    return new Date(now.getTime() + scheduledForMillis)
  }
}
