import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { ActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

export class Activity {
  private constructor(
    public readonly id: Identifier,
    public readonly title: ActivityTitle,
    public readonly description: ActivityDescription | null,
    public readonly status: ActivityStatus,
    public readonly sportId: Identifier,
    public readonly levels: Array<Identifier>,
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
    private _pendingDomainEvents: Array<DomainEvent> = [],
  ) {}

  public static create(
    activityId: Identifier,
    sportId: Identifier,
    domainEventId: Identifier,
    title: ActivityTitle,
    description: ActivityDescription | null,
    hostId: Identifier,
    validatedConfig: ActivityValidatedConfig,
    scheduledAt: ActivityScheduledDate,
    now: Date,
  ): Activity {
    const capacities = validatedConfig.getCapacities()

    const minDuration = validatedConfig.minDuration
    const maxDuration = validatedConfig.maxDuration

    const status = ActivityStatus.open()
    const currentParticipants = IntegerNumber.create(1)

    const domainEvent = DomainEvent.create(
      domainEventId,
      DomainEventName.activityCreated(),
      DomainEventAggregateType.activity(),
      activityId,
      {
        activityId: activityId.value,
        scheduledAt: scheduledAt.toString(),
      },
      {},
      now,
    )

    return new Activity(
      activityId,
      title,
      description,
      status,
      sportId,
      validatedConfig.getLevels(),
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
      [domainEvent],
    )
  }

  public static reconstitute(
    id: Identifier,
    title: ActivityTitle,
    description: ActivityDescription | null,
    status: ActivityStatus,
    sportId: Identifier,
    levels: Array<Identifier>,
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
      levels,
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

  public pullDomainEvents(): Array<DomainEvent> {
    const events = [...this._pendingDomainEvents]
    this._pendingDomainEvents = []
    return events
  }

  public isHostedBy(participantId: Identifier): boolean {
    return this.hostId.equals(participantId)
  }
}
