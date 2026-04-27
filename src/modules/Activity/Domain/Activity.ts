import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ActivityTitle'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { ActivityStatus } from '~/src/modules/Activity/Domain/ActivityStatus'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ActivityDescription'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ActivityScheduledDate'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ActivityValidatedConfig'

export class Activity {
  private constructor(
    public readonly id: Identifier,
    public readonly title: ActivityTitle,
    public readonly description: ActivityDescription | null,
    public readonly status: ActivityStatus,
    public readonly sportId: Identifier,
    public readonly levelIds: Array<Identifier>,
    public readonly hostId: Identifier,
    public readonly minCapacity: IntegerNumber,
    public readonly maxCapacity: IntegerNumber,
    public readonly minDuration: Duration | null,
    public readonly maxDuration: Duration | null,
    public readonly currentParticipants: IntegerNumber,
    public readonly location: Location | null,
    public readonly config: ActivityValidatedConfig,
    public readonly scheduledAt: ActivityScheduledDate,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: Identifier,
    title: ActivityTitle,
    description: ActivityDescription | null,
    hostId: Identifier,
    validatedConfig: ActivityValidatedConfig,
    scheduledAt: ActivityScheduledDate,
    now: Date,
  ): Activity {
    const capacities = validatedConfig.getCapacities()
    const durationRange = validatedConfig.getDurationRange()

    const minDuration = durationRange ? durationRange.start : null
    const maxDuration = durationRange ? durationRange.end : null

    const status = ActivityStatus.open()
    const currentParticipants = IntegerNumber.fromNumber(1)

    return new Activity(
      id,
      title,
      description,
      status,
      validatedConfig.sportId,
      validatedConfig.getLevelIds(),
      hostId,
      capacities.min,
      capacities.max,
      minDuration,
      maxDuration,
      currentParticipants,
      validatedConfig.getLocation(),
      validatedConfig,
      scheduledAt,
      now,
      now,
    )
  }

  public static reconstitute(
    id: Identifier,
    title: ActivityTitle,
    description: ActivityDescription | null,
    status: ActivityStatus,
    sportId: Identifier,
    levelIds: Array<Identifier>,
    hostId: Identifier,
    minCapacity: IntegerNumber,
    maxCapacity: IntegerNumber,
    minDuration: Duration | null,
    maxDuration: Duration | null,
    currentParticipants: IntegerNumber,
    location: Location | null,
    config: ActivityValidatedConfig,
    scheduledAt: ActivityScheduledDate,
    createdAt: Date,
    updatedAt: Date,
  ): Activity {
    return new Activity(
      id,
      title,
      description,
      status,
      sportId,
      levelIds,
      hostId,
      minCapacity,
      maxCapacity,
      minDuration,
      maxDuration,
      currentParticipants,
      location,
      config,
      scheduledAt,
      createdAt,
      updatedAt,
    )
  }
}
