import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { ParticipationApplicationDto } from '~/src/modules/Activity/Application/Dto/ParticipationApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class ParticipationApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<Participation, ParticipationApplicationDto>
{
  public translate(domain: Participation): ParticipationApplicationDto {
    return {
      id: domain.id.value,
      activityId: domain.activityId.value,
      userId: domain.userId.value,
      leftAt: domain.leftAt,
      joinedAt: domain.joinedAt,
    }
  }
}
