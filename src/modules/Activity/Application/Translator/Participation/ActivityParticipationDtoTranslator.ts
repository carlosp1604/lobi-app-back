import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { ActivityParticipationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityParticipationReadModel'

export class ActivityParticipationDtoTranslator
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
