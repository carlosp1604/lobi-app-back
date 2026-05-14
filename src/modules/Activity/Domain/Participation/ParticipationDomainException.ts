import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ParticipationDomainException extends DomainException {
  public readonly __brand = 'ParticipationDomainException' as const

  public static readonly participationIsAlreadyInactiveId = 'participation_domain_participation_is_already_inactive'
  public static readonly participationIsStillActiveId = 'participation_domain_participation_is_still_active'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, ParticipationDomainException.name, context)
  }

  public static participationIsAlreadyInactive(activityId: Identifier, participantId: Identifier) {
    return new ParticipationDomainException(
      'Cannot disable participation. This participation is already inactive',
      this.participationIsAlreadyInactiveId,
      {
        activityId: activityId.value,
        participantId: participantId.value,
      },
    )
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
