import { User } from '~/src/modules/User/Domain/User'
import { UserApplicationDto } from '~/src/modules/Auth/Application/Dto/UserApplicationDto'

export class UserApplicationDtoTranslator {
  public static fromDomain(domain: User): UserApplicationDto {
    return {
      id: domain.id.value,
      name: domain.name.value,
      username: domain.username.value,
      // TODO: Add imageUrl when is supported
      imageUrl: null,
    }
  }
}
