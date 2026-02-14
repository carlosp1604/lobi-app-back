import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'
import { SportsmanProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'

export class SportsmanProfileTranslator {
  public static toDomain(rawModel: SportsmanProfileRawModel, now: Date): SportsmanProfile {
    return new SportsmanProfile(
      UserProfileId.fromString(rawModel.id),
      UserId.fromString(rawModel.user_id),
      rawModel.birth_date ? SportsmanProfileBirthDate.fromString(rawModel.birth_date, now) : null,
      rawModel.bio ? SportsmanProfileBio.fromString(rawModel.bio) : null,
      rawModel.created_at,
      rawModel.updated_at,
    )
  }

  public static toDatabase(domain: SportsmanProfile): SportsmanProfileRawModel {
    return {
      id: domain.id.value,
      user_id: domain.userId.value,
      bio: domain.bio ? domain.bio.value : null,
      birth_date: domain.birthDate ? domain.birthDate.toISODate() : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
