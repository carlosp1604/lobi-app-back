import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityHostDto } from '~/src/modules/Activity/Application/Dto/ActivityHostDto'
import { ActivityListReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityListReadModel'
import { DurationDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationDtoTranslator'
import { LocationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { SportDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportDtoTranslator'
import { LocationDto, MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { ActivityHostDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityHostDtoTranslator'
import { ActivityParticipationDtoTranslator } from '~/src/modules/Activity/Application/Translator/Participation/ActivityParticipationDtoTranslator'
import {
  GetActivitiesCriteria,
  GetActivitiesCriteriaActiveFilters,
} from '~/src/modules/Activity/Application/Shared/GetActivitiesCriteria'
import {
  ActivityListItemQueryDto,
  GetActivitiesQueryActiveFiltersDto,
  GetActivitiesQueryResponseDto,
  TeamConfigQueryDto,
} from '~/src/modules/Activity/Application/Shared/GetActivitiesQueryResponseDto'
import { SportLevelDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportLevelDtoTranslator'

export interface GetActivitiesResponseContext {
  activityList: ActivityListReadModel
  criteria: GetActivitiesCriteria
  userId: Identifier | null
}

export class GetActivitiesQueryResponseDtoTranslator
  implements DtoTranslatorInterface<GetActivitiesResponseContext, GetActivitiesQueryResponseDto>
{
  public translate(context: GetActivitiesResponseContext): GetActivitiesQueryResponseDto {
    const { activityList, criteria, userId } = context

    const items: Array<ActivityListItemQueryDto> = activityList.items.map((rawData) => {
      let isHost = false
      let isParticipant = false

      if (rawData.host && userId) {
        isHost = rawData.host.id === userId.value
      }

      if (userId && rawData.current_participation) {
        isParticipant = true
      }

      let location: LocationDto | null = null

      if (rawData.location_geojson) {
        location = new LocationDtoTranslator().translate({
          lng: String(rawData.location_geojson.coordinates[0]),
          lat: String(rawData.location_geojson.coordinates[1]),
        })
      }

      let duration: { min: MagnitudeDto; max: MagnitudeDto } | null = null

      if (rawData.min_duration && rawData.max_duration) {
        duration = {
          min: new DurationDtoTranslator().translate({
            value: String(rawData.min_duration),
            normalizedValue: String(rawData.min_duration),
            unit: Duration.DEFAULT_UNIT,
          }),
          max: new DurationDtoTranslator().translate({
            value: String(rawData.max_duration),
            normalizedValue: String(rawData.max_duration),
            unit: Duration.DEFAULT_UNIT,
          }),
        }
      }

      let activityHost: ActivityHostDto | null = null
      let currentParticipation: ActivityParticipationDto | null = null

      if (rawData.host) {
        activityHost = new ActivityHostDtoTranslator().translate(rawData.host)
      }

      if (rawData.current_participation) {
        currentParticipation = new ActivityParticipationDtoTranslator().translate(rawData.current_participation)
      }

      let teamConfig: TeamConfigQueryDto | null = null

      if (rawData.team_config) {
        teamConfig = {
          minTeams: rawData.team_config.minTeams,
          maxTeams: rawData.team_config.maxTeams,
          playersPerTeam: rawData.team_config.playersPerTeam,
        }
      }

      const levels = rawData.levels.map((level) => new SportLevelDtoTranslator().translate(level))

      return {
        id: rawData.id,
        title: rawData.title,
        description: rawData.description,
        status: rawData.status,
        location,
        capacity: {
          min: rawData.min_capacity,
          max: rawData.max_capacity,
        },
        duration,
        currentParticipants: rawData.current_participants,
        createdAt: rawData.created_at,
        scheduledAt: rawData.scheduled_at,
        levels,
        teamConfig,
        participation: currentParticipation,
        host: activityHost,
        sport: new SportDtoTranslator().translate(rawData.sport),
        isHost,
        isParticipant,
      }
    })

    const paginationAndSort = criteria.getPaginationAndSort()

    return {
      items,
      activeFilters: this.translateFilters(criteria.getActiveFilters()),
      pagination: {
        page: paginationAndSort.page.value,
        perPage: paginationAndSort.perPage.value,
      },
      sort: {
        direction: paginationAndSort.sortDirection,
        by: paginationAndSort.sortBy,
      },
      hasNext: activityList.hasNext,
      hasPrevious: activityList.hasPrevious,
      total: activityList.total,
    }
  }

  private translateFilters(activeFilters: GetActivitiesCriteriaActiveFilters): GetActivitiesQueryActiveFiltersDto {
    const response: GetActivitiesQueryActiveFiltersDto = {}

    if (activeFilters.location) {
      response.location = {
        lat: activeFilters.location.lat.stringValue,
        lng: activeFilters.location.lng.stringValue,
      }
    }

    if (activeFilters.radius) {
      response.radius = activeFilters.radius.value
    }

    if (activeFilters.statuses) {
      response.statuses = activeFilters.statuses.map((activityStatus) => activityStatus.value)
    }

    if (activeFilters.levelIds) {
      response.levelIds = activeFilters.levelIds.map((identifier) => identifier.value)
    }

    if (activeFilters.sportId) {
      response.sportId = activeFilters.sportId.value
    }

    if (activeFilters.participantId) {
      response.participantId = activeFilters.participantId.value
    }

    if (activeFilters.hostId) {
      response.hostId = activeFilters.hostId.value
    }

    if (activeFilters.minFreeSlots) {
      response.minFreeSlots = activeFilters.minFreeSlots.value
    }

    if (activeFilters.minDuration) {
      response.minDuration = activeFilters.minDuration.value.value
    }

    if (activeFilters.maxDuration) {
      response.minDuration = activeFilters.maxDuration.value.value
    }

    if (activeFilters.maxDateSeconds) {
      response.maxDateSeconds = activeFilters.maxDateSeconds.value
    }

    return response
  }
}
