import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { ParticipationRawModel } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'

export class ParticipationModelTranslator {
  public static toDomain(raw: ParticipationRawModel): Participation {
    return Participation.reconstitute(
      Identifier.fromString(raw.id),
      Identifier.fromString(raw.activity_id),
      Identifier.fromString(raw.user_id),
      raw.joined_at,
      raw.left_at,
    )
  }

  public static toDatabase(domain: Participation): ParticipationRawModel {
    return {
      id: domain.id.toPrimitives(),
      activity_id: domain.activityId.toPrimitives(),
      user_id: domain.userId.toPrimitives(),
      joined_at: domain.joinedAt,
      left_at: domain.leftAt,
    }
  }
}
