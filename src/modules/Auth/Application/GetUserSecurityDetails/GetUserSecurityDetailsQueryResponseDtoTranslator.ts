import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSecurityDetailsReadModel } from '~/src/modules/Auth/Application/ReadModel/UserSecurityDetailsReadModel'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import {
  GetUserSecurityDetailsQueryResponseDto,
  RelativeDateDto,
  UserActiveSessionsDto,
  UserCredentialDto,
} from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryResponseDto'

export type GetUserSecurityDetailsResponseContext = {
  currentSessionId: Identifier
  readModel: UserSecurityDetailsReadModel
  now: Date
}

export class GetUserSecurityDetailsQueryResponseDtoTranslator
  implements DtoTranslatorInterface<GetUserSecurityDetailsResponseContext, GetUserSecurityDetailsQueryResponseDto>
{
  public translate(context: GetUserSecurityDetailsResponseContext): GetUserSecurityDetailsQueryResponseDto {
    const { currentSessionId, readModel, now } = context
    const sessions: Array<UserActiveSessionsDto> = readModel.sessions.map((sessionReadModel) => {
      let deviceCountryCode: string | null = null
      let deviceCity: string | null = null

      if (sessionReadModel.device_city !== null) {
        deviceCity = sessionReadModel.device_city
      }

      if (sessionReadModel.device_country_code !== null) {
        deviceCountryCode = sessionReadModel.device_country_code
      }

      return {
        id: sessionReadModel.id,
        deviceLocation: {
          countryCode: deviceCountryCode,
          city: deviceCity,
        },
        deviceInfo: sessionReadModel.device_info,
        isCurrent: sessionReadModel.id === currentSessionId.value,
        activeSince: this.calculateRelativeDate(new Date(sessionReadModel.created_at), now),
        expiresAt: this.calculateRelativeDate(now, new Date(sessionReadModel.expires_at)),
      }
    })

    let credential: UserCredentialDto

    if (readModel.credential.last_modified_at === null) {
      credential = {
        lastModifiedAt: null,
      }
    } else {
      credential = {
        lastModifiedAt: this.calculateRelativeDate(now, new Date(readModel.credential.last_modified_at)),
      }
    }

    return { credential, sessions }
  }

  private calculateRelativeDate(referenceDate: Date, dateToCalculate: Date): RelativeDateDto {
    const diffInMs = Math.abs(dateToCalculate.getTime() - referenceDate.getTime())

    const msInMinute = 1000 * 60
    const msInHour = msInMinute * 60
    const msInDay = msInHour * 24
    const msInMonth = msInDay * 30
    const msInYear = msInDay * 365

    const years = Math.floor(diffInMs / msInYear)
    if (years >= 1) {
      return { quantity: years, unit: 'years' }
    }

    const months = Math.floor(diffInMs / msInMonth)
    if (months >= 1) {
      return { quantity: months, unit: 'months' }
    }

    const days = Math.floor(diffInMs / msInDay)
    if (days >= 1) {
      return { quantity: days, unit: 'days' }
    }

    const hours = Math.floor(diffInMs / msInHour)
    if (hours >= 1) {
      return { quantity: hours, unit: 'hours' }
    }

    const minutes = Math.floor(diffInMs / msInMinute)

    return { quantity: minutes > 0 ? minutes : 0, unit: 'minutes' }
  }
}
