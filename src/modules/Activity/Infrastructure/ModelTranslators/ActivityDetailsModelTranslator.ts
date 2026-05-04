import { SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { ActivityRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { ActivityDetailsModel } from '~/src/modules/Activity/Domain/ReadModel/ActivityDetailsModel'
import { ActivityHostRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity-host.entity'
import { SportModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/SportModelTranslator'
import { ParticipationRawModel } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { ActivityModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ActivityModelTranslator'
import { ParticipantModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ParticipantModelTranslator'
import { ParticipationModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ParticipationModelTranslator'

export class ActivityDetailsModelTranslator {
  public static toDomain(
    activityRawModel: ActivityRawModel,
    sportRawModel: SportRawModel,
    activityHostRawModel: ActivityHostRawModel,
    participationRawModel: ParticipationRawModel | null,
  ): ActivityDetailsModel {
    const activityHostDomainModel = ParticipantModelTranslator.toDomain({
      id: activityHostRawModel.id,
      status: activityHostRawModel.status,
      deleted_at: activityHostRawModel.deleted_at,
    })

    const sportDomainModel = SportModelTranslator.toDomain(sportRawModel)
    const activityDomainModel = ActivityModelTranslator.toDomain(activityRawModel, sportDomainModel)

    return {
      activity: activityDomainModel,
      host: {
        id: activityHostRawModel.id,
        name: activityHostRawModel.name,
        username: activityHostRawModel.username,
        isActive: activityHostDomainModel.isActive(),
        userUploadId: activityHostRawModel.user_upload_id,
      },
      sport: {
        id: sportDomainModel.id.value,
        slug: sportDomainModel.slug.value,
        imageUrl: sportDomainModel.imageUrl ? sportDomainModel.imageUrl.value : null,
      },
      participation: participationRawModel ? ParticipationModelTranslator.toDomain(participationRawModel) : null,
    }
  }
}
