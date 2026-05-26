import { ActivityParticipationQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationQueryDto'
import { ActivityParticipationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityParticipationReadModel'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class ActivityParticipationQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<ActivityParticipationReadModel, ActivityParticipationQueryDto>
{
  public translate(readModel: ActivityParticipationReadModel): ActivityParticipationQueryDto {
    return {
      id: readModel.id,
      userId: readModel.userId,
      joinedAt: readModel.joinedAt,
    }
  }
}
