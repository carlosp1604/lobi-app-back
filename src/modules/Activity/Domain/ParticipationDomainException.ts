import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ParticipationDomainException extends DomainException {
  public readonly __brand = 'ParticipationDomainException' as const

  public static inactiveParticipationId = 'participation_domain_inactive_participation'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, ParticipationDomainException.name, context)
  }

  public static inactiveParticipation(userId: string, activityId: string) {
    return new ParticipationDomainException('This participation is already inactive', this.inactiveParticipationId, {
      userId,
      activityId,
    })
  }
}
