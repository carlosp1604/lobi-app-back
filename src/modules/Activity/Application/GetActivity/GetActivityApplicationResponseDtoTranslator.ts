import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityDetailsModel } from '~/src/modules/Activity/Domain/ReadModel/ActivityDetailsModel'
import { ActivityApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityApplicationDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { GetActivityApplicationResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityApplicationResponseDto'
import { ParticipationApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/ParticipationApplicationDtoTranslator'

export interface GetActivityResponseContext {
  activityDetails: ActivityDetailsModel
  userId: Identifier | null
}

export class GetActivityApplicationResponseDtoTranslator
  implements ApplicationDtoTranslatorInterface<GetActivityResponseContext, GetActivityApplicationResponseDto>
{
  public translate(context: GetActivityResponseContext): GetActivityApplicationResponseDto {
    const { activityDetails, userId } = context
    const { activity, host, participation } = activityDetails

    return {
      activity: new ActivityApplicationDtoTranslator().translate(activity),
      participation: participation ? new ParticipationApplicationDtoTranslator().translate(participation) : null,
      hostActivity: host.isActive
        ? {
            id: host.id,
            name: host.name,
            username: host.username,
            userUploadId: host.userUploadId,
          }
        : null,
      isHost: userId ? activity.isHostedBy(userId) : false,
      isParticipant: participation !== null,
    }
  }
}
