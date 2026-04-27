import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ParticipationDomainException } from '~/src/modules/Activity/Domain/ParticipationDomainException'

export class Participation {
  private constructor(
    public readonly id: Identifier,
    public readonly activityId: Identifier,
    public readonly userId: Identifier,
    public readonly joinedAt: Date,
    private _leftAt: Date | null,
  ) {}

  get leftAt(): Date | null {
    return this._leftAt
  }

  public static create(id: Identifier, activityId: Identifier, userId: Identifier, now: Date): Participation {
    return new Participation(id, activityId, userId, now, null)
  }

  public static reconstitute(
    id: Identifier,
    activityId: Identifier,
    userId: Identifier,
    joinedAt: Date,
    leftAt: Date | null,
  ): Participation {
    return new Participation(id, activityId, userId, joinedAt, leftAt)
  }

  public isActive(): boolean {
    return this._leftAt === null
  }

  public leave(currentTime: Date): void {
    const canLeaveResult = this.canLeave()

    if (!canLeaveResult.success) {
      throw canLeaveResult.error
    }

    this._leftAt = currentTime
  }

  public canLeave(): Result<void, ParticipationDomainException> {
    if (!this.isActive()) {
      return fail(ParticipationDomainException.inactiveParticipation(this.userId.value, this.activityId.value))
    }

    return success(undefined)
  }
}
