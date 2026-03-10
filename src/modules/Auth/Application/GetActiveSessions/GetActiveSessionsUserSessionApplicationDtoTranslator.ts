import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { GetActiveSessionsUserSessionApplicationDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationResponseDto'

export class GetActiveSessionsUserSessionApplicationDtoTranslator {
  public static fromDomain(domain: UserSession, currentSessionId: Identifier): GetActiveSessionsUserSessionApplicationDto {
    let deviceCountryCode: string | null = null
    let deviceCity: string | null = null

    if (domain.deviceLocation !== null) {
      deviceCountryCode = domain.deviceLocation.countryCode
      deviceCity = domain.deviceLocation.city
    }

    return {
      id: domain.id.value,
      deviceCountryCode,
      deviceCity,
      userAgent: domain.userAgent.value,
      isCurrent: domain.id.value === currentSessionId.value,
      activeSince: domain.createdAt,
      expiresAt: domain.expiresAt,
    }
  }
}
