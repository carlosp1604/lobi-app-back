import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { ActivityParticipationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityParticipationReadModel'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class ActivityParticipationQueryDtoTranslator
  implements DtoTranslatorInterface<ActivityParticipationReadModel, ActivityParticipationDto>
{
  public translate(readModel: ActivityParticipationReadModel): ActivityParticipationDto {
    return {
      id: readModel.id,
      userId: readModel.userId,
      joinedAt: readModel.joinedAt,
    }
  }
}
