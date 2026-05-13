import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ParticipationDomainException extends DomainException {
  public readonly __brand = 'ParticipationDomainException' as const

  public static readonly inactiveParticipationId = 'participation_domain_inactive_participation'
  public static readonly participationIsStillActiveId = 'participation_domain_participation_is_still_active'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, ParticipationDomainException.name, context)
  }

  public static inactiveParticipation(userId: string, activityId: string) {
    return new ParticipationDomainException('This participation is already inactive', this.inactiveParticipationId, {
      userId,
      activityId,
    })
  }

  public static participationIsStillActive(activityId: Identifier, participantId: Identifier) {
    return new ParticipationDomainException(
      'Cannot enable participation. This participation is still active',
      this.participationIsStillActiveId,
      {
        activityId: activityId.value,
        participantId: participantId.value,
      },
    )
  }
}
