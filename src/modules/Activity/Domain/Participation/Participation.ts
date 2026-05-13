import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ParticipationDomainException } from '~/src/modules/Activity/Domain/Participation/ParticipationDomainException'

export class Participation {
  private constructor(
    public readonly id: Identifier,
    public readonly activityId: Identifier,
    public readonly participantId: Identifier,
    private _joinedAt: Date,
    private _leftAt: Date | null,
  ) {}

  get leftAt(): Date | null {
    return this._leftAt
  }

  get joinedAt(): Date {
    return this._joinedAt
  }

  public static create(id: Identifier, activityId: Identifier, participantId: Identifier, now: Date): Participation {
    return new Participation(id, activityId, participantId, now, null)
  }

  public static reconstitute(
    id: Identifier,
    activityId: Identifier,
    participantId: Identifier,
    joinedAt: Date,
    leftAt: Date | null,
  ): Participation {
    return new Participation(id, activityId, participantId, joinedAt, leftAt)
  }

  public canEnable(): Result<void, ParticipationDomainException> {
    if (this._leftAt === null) {
      return fail(ParticipationDomainException.participationIsStillActive(this.id, this.participantId))
    }

    return success(undefined)
  }

  public enable(now: Date): void {
    const canEnableResult = this.canEnable()

    if (!canEnableResult.success) {
      throw canEnableResult.error
    }

    this._leftAt = null
    this._joinedAt = now
  }

  public leave(currentTime: Date): void {
    const canLeaveResult = this.canLeave()

    if (!canLeaveResult.success) {
      throw canLeaveResult.error
    }

    this._leftAt = currentTime
  }

  public isActive(): boolean {
    return this._leftAt === null
  }

  public canLeave(): Result<void, ParticipationDomainException> {
    if (!this.isActive()) {
      return fail(ParticipationDomainException.inactiveParticipation(this.participantId.value, this.activityId.value))
    }

    return success(undefined)
  }
}
