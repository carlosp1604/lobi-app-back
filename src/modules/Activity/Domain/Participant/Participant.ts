import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ValidUserStatuses } from '~/src/modules/Shared/Domain/ValidUserStatuses'
import { ParticipantDomainException } from '~/src/modules/Activity/Domain/Participant/ParticipantDomainException'

export class Participant {
  private constructor(
    public readonly id: Identifier,
    private readonly status: ValidUserStatuses,
    private readonly isDeleted: boolean,
  ) {}

  public static reconstitute(id: Identifier, status: string, deleteAt: Date | null) {
    this.assertStatus(status)

    return new Participant(id, status as ValidUserStatuses, deleteAt !== null)
  }

  public isActive(): boolean {
    return !this.isDeleted && this.status === ValidUserStatuses.ACTIVE
  }

  private static assertStatus(status: string): void {
    const validStatuses = Object.values(ValidUserStatuses)
    const isValid = validStatuses.includes(status as ValidUserStatuses)

    if (!isValid) {
      throw ParticipantDomainException.invalidParticipantAccountStatus(status, validStatuses)
    }
  }
}
