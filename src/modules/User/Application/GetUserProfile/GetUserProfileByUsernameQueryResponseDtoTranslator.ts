import { UserProfileDetailsReadModel } from '~/src/modules/User/Application/ReadModel/UserProfileDetailsReadModel'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { GetUserProfileByUsernameQueryResponseDto } from '~/src/modules/User/Application/GetUserProfile/GetUserProfileByUsernameQueryResponseDto'

export class GetUserProfileByUsernameQueryResponseDtoTranslator
  implements ApplicationDtoTranslatorInterface<UserProfileDetailsReadModel, GetUserProfileByUsernameQueryResponseDto>
{
  public translate(data: UserProfileDetailsReadModel): GetUserProfileByUsernameQueryResponseDto {
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      bio: data.bio,
      imageUrl: data.image_url,
      birthDate: data.birth_date,
      createdAt: data.created_at,
    }
  }
}
