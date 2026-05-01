import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { ActivityApplicationDto } from '~/src/modules/Activity/Application/Dto/ActivityApplicationDto'
import { LocationApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { LocationApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationApplicationDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { RankingOptionApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/RankingOptionApplicationDtoTranslator'
import { ActivityConfigApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityConfigApplicationDtoTranslator'

export class ActivityApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Activity, ActivityApplicationDto> {
  public translate(domain: Activity): ActivityApplicationDto {
    let description: string | null = null
    let location: LocationApplicationDto | null = null
    let minDuration: number | null = null
    let maxDuration: number | null = null

    if (domain.description) {
      description = domain.description.value
    }

    if (domain.location) {
      location = new LocationApplicationDtoTranslator().translate(domain.location)
    }

    if (domain.minDuration) {
      minDuration = domain.minDuration.value.value
    }

    if (domain.maxDuration) {
      maxDuration = domain.maxDuration.value.value
    }

    const levels = domain.levels.map((level) => new RankingOptionApplicationDtoTranslator().translate(level))
    const config = new ActivityConfigApplicationDtoTranslator().translate(domain.config)

    return {
      id: domain.id.value,
      title: domain.title.value,
      description,
      sportId: domain.sportId.value,
      hostId: domain.hostId.value,
      status: domain.status.value,
      location,
      maxCapacity: domain.maxCapacity.value,
      minCapacity: domain.minCapacity.value,
      maxDuration,
      minDuration,
      currentParticipants: domain.currentParticipants.value,
      scheduledAt: domain.scheduledAt.value,
      config,
      levels,
    }
  }
}
