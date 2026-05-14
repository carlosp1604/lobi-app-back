import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { ActivityStatus, ValidActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'

export class Activity {
  private constructor(
    public readonly id: Identifier,
    public readonly title: ActivityTitle,
    public readonly description: ActivityDescription | null,
    private _status: ActivityStatus,
    public readonly sportId: Identifier,
    public readonly levels: Array<Identifier>,
    private _hostId: Identifier,
    public readonly minCapacity: IntegerNumber,
    public readonly maxCapacity: IntegerNumber,
    public readonly minDuration: Duration | null,
    public readonly maxDuration: Duration | null,
    private _currentParticipants: IntegerNumber,
    public readonly location: Location | null,
    public readonly config: ActivityValidatedConfig,
    public readonly scheduledAt: ActivityScheduledDate,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _pendingDomainEvents: Array<DomainEvent> = [],
  ) {}

  public get hostId(): Identifier {
    return this._hostId
  }

  public get status(): ActivityStatus {
    return this._status
  }

  public get currentParticipants(): IntegerNumber {
    return this._currentParticipants
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  public isHostedBy(participantId: Identifier): boolean {
    return this.hostId.equals(participantId)
  }

  public hasParticipants(): boolean {
    return this._currentParticipants.isGreaterThan(IntegerNumber.create(1))
  }

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

  public canBeJoinedAt(now: Date): Result<void, ActivityDomainException> {
    if (!(this.status.isOpen() || this.status.isConfirmed())) {
      return fail(
        ActivityDomainException.activityStatusDoesNotAllowJoin(this.id, this.status, [
          ValidActivityStatus.OPEN,
          ValidActivityStatus.CONFIRMED,
        ]),
      )
    }

    if (this.scheduledAt.isPastJoinTolerance(now)) {
      return fail(ActivityDomainException.activityAlreadyStarted(this.id, this.scheduledAt, now))
    }

    if (!this.status.isConfirmed() && this.scheduledAt.isPastStartTime(now)) {
      return fail(
        ActivityDomainException.activityNotAvailableToJoin(this.id, this._currentParticipants, this.minCapacity, this.scheduledAt, now),
      )
    }

    if (this.currentParticipants.isGreaterThanOrEqual(this.maxCapacity)) {
      return fail(ActivityDomainException.activityAlreadyFull(this.id, this.currentParticipants, this.maxCapacity))
    }

    return success(undefined)
  }

  public canBeLeftAt(now: Date, participantId: Identifier): Result<void, ActivityDomainException> {
    if (!this.status.isOpen()) {
      return fail(ActivityDomainException.activityStatusDoesNotAllowLeave(this.id, this.status, [ValidActivityStatus.OPEN]))
    }

    if (this.isHostedBy(participantId) && !this.hasParticipants()) {
      return success(undefined)
    }

    if (this.scheduledAt.isPastLeaveMargin(now)) {
      return fail(
        ActivityDomainException.activityLeaveDeadlineAlreadyPassed(
          this.id,
          this.scheduledAt,
          ActivityScheduledDate.LEAVE_TOLERANCE_MINUTES,
          now,
        ),
      )
    }

    if (this.currentParticipants.isGreaterThanOrEqual(this.minCapacity)) {
      return fail(ActivityDomainException.activityAlreadyConfirmedToTakePlace(this.id, this.currentParticipants, this.minCapacity))
    }

    if (this.isHostedBy(participantId) && this.hasParticipants()) {
      return fail(ActivityDomainException.hostCannotLeaveActivity(this.id, this.hostId))
    }

    return success(undefined)
  }

  public canBeCancelledBy(participantId: Identifier): Result<void, ActivityDomainException> {
    if (!this.status.isOpen()) {
      return fail(ActivityDomainException.activityStatusDoesNotAllowCancel(this.id, this.status, [ValidActivityStatus.OPEN]))
    }

    if (!this.isHostedBy(participantId)) {
      return fail(ActivityDomainException.onlyHostCanCancelActivity(this.id, participantId, this.hostId))
    }

    if (!this.currentParticipants.equals(IntegerNumber.create(1))) {
      return fail(ActivityDomainException.activityCannotBeCancelledWithParticipants(this.id, this.currentParticipants))
    }

    return success(undefined)
  }

  public canReplaceHost(candidateParticipantId: Identifier): Result<void, ActivityDomainException> {
    if (this.isHostedBy(candidateParticipantId)) {
      return fail(ActivityDomainException.cannotReplaceHostWithCurrentHost(this.id, this.hostId))
    }

    return success(undefined)
  }

  public leave(
    participantLeftDomainEventId: Identifier,
    activityCancelledDomainEventId: Identifier,
    participantId: Identifier,
    now: Date,
  ): void {
    const canBeLeftAtResult = this.canBeLeftAt(now, participantId)

    if (!canBeLeftAtResult.success) {
      throw canBeLeftAtResult.error
    }

    this._currentParticipants = this._currentParticipants.subtract(IntegerNumber.create(1))

    const participantLeftDomainEvent = DomainEvent.create(
      participantLeftDomainEventId,
      DomainEventName.participantLeft(),
      DomainEventAggregateType.activity(),
      this.id,
      {
        activityId: this.id.value,
        participantId: participantId.value,
      },
      {},
      now,
    )

    this._pendingDomainEvents.push(participantLeftDomainEvent)

    if (this.currentParticipants.isLessThanOrEqual(IntegerNumber.create(0))) {
      this._status = ActivityStatus.cancelled()

      const activityCancelledDomainEvent = DomainEvent.create(
        activityCancelledDomainEventId,
        DomainEventName.activityCancelled(),
        DomainEventAggregateType.activity(),
        this.id,
        {},
        {},
        now,
      )

      this._pendingDomainEvents.push(activityCancelledDomainEvent)
    }

    this._updatedAt = now
  }

  public join(
    participantJoinedDomainEventId: Identifier,
    activityConfirmedDomainEventId: Identifier,
    participantId: Identifier,
    now: Date,
  ): void {
    const canBeJoinedAtResult = this.canBeJoinedAt(now)

    if (!canBeJoinedAtResult.success) {
      throw canBeJoinedAtResult.error
    }

    this._currentParticipants = this._currentParticipants.add(IntegerNumber.create(1))

    const participantJoinedDomainEvent = DomainEvent.create(
      activityConfirmedDomainEventId,
      DomainEventName.participantJoined(),
      DomainEventAggregateType.activity(),
      this.id,
      {
        activityId: this.id.value,
        participantId: participantId.value,
      },
      {},
      now,
    )

    this._pendingDomainEvents.push(participantJoinedDomainEvent)

    if (this.currentParticipants.isGreaterThanOrEqual(this.minCapacity) && !this.status.isConfirmed()) {
      this._status = ActivityStatus.confirmed()

      const activityConfirmedDomainEvent = DomainEvent.create(
        participantJoinedDomainEventId,
        DomainEventName.activityConfirmed(),
        DomainEventAggregateType.activity(),
        this.id,
        {},
        {},
        now,
      )

      this._pendingDomainEvents.push(activityConfirmedDomainEvent)
    }

    this._updatedAt = now
  }

  public cancel(activityCancelledDomainEventId: Identifier, participantId: Identifier, now: Date): void {
    const canBeCancelledByResult = this.canBeCancelledBy(participantId)

    if (!canBeCancelledByResult.success) {
      throw canBeCancelledByResult.error
    }

    this._status = ActivityStatus.cancelled()

    const activityCancelledDomainEvent = DomainEvent.create(
      activityCancelledDomainEventId,
      DomainEventName.activityCancelled(),
      DomainEventAggregateType.activity(),
      this.id,
      {},
      {},
      now,
    )

    this._pendingDomainEvents.push(activityCancelledDomainEvent)

    this._updatedAt = now
  }

  public replaceHost(candidateParticipantId: Identifier, newHostDomainEventId: Identifier, now: Date): void {
    const canReplaceHostResult = this.canReplaceHost(candidateParticipantId)

    if (!canReplaceHostResult.success) {
      throw canReplaceHostResult.error
    }

    const activityNewHostDomainEvent = DomainEvent.create(
      newHostDomainEventId,
      DomainEventName.newHost(),
      DomainEventAggregateType.activity(),
      this.id,
      {
        currentHost: this._hostId.value,
        newHost: candidateParticipantId.value,
      },
      {},
      now,
    )

    this._hostId = candidateParticipantId
    this._updatedAt = now
    this._pendingDomainEvents.push(activityNewHostDomainEvent)
  }

  public pullDomainEvents(): Array<DomainEvent> {
    const events = [...this._pendingDomainEvents]
    this._pendingDomainEvents = []
    return events
  }
}
