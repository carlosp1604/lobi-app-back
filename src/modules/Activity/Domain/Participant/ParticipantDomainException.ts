import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class ParticipantDomainException extends DomainException {
  public readonly __brand = 'ParticipantDomainException' as const

  public static invalidParticipantAccountStatusId = 'participant_domain_invalid_participant_account_status'

  private constructor(message: string, id: string, context?: DomainExceptionContext) {
    super(message, id, ParticipantDomainException.name, context)
  }

  public static invalidParticipantAccountStatus(current: string, validStatuses: Array<string>) {
    return new ParticipantDomainException(
      `Invalid participant account status. Valid statuses are: [${validStatuses.join(',')}]`,
      this.invalidParticipantAccountStatusId,
      {
        status: current,
        validStatuses,
      },
    )
  }
}
