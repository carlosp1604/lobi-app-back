import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Participant } from '~/src/modules/Activity/Domain/Participant/Participant'
import { ParticipantRawModel } from '~/src/modules/Activity/Infrastructure/Entities/participant.entity'

export class ParticipantModelTranslator {
  public static toDomain(raw: ParticipantRawModel): Participant {
    return Participant.reconstitute(Identifier.fromString(raw.id), raw.status, raw.deleted_at)
  }
}
