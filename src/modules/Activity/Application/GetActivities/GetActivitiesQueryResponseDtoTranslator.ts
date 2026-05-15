import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityHostQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityHostQueryDto'
import { ActivityListReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityListReadModel'
import { SportQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportQueryDtoTranslator'
import { DurationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationQueryDtoTranslator'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { ActivityParticipationQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationQueryDto'
import { ActivityHostQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityHostQueryDtoTranslator'
import { RankingChoiceQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/RankingChoiceQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { LocationQueryDto, MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ActivityParticipationQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Participation/ActivityParticipationQueryDtoTranslator'
import {
  GetActivitiesCriteria,
  GetActivitiesCriteriaActiveFilters,
} from '~/src/modules/Activity/Application/GetActivities/GetActivitiesCriteria'
import {
  ActivityListItemQueryDto,
  GetActivitiesQueryActiveFiltersDto,
  GetActivitiesQueryResponseDto,
  TeamConfigQueryDto,
} from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryResponseDto'

export interface GetActivitiesResponseContext {
  activityList: ActivityListReadModel
  criteria: GetActivitiesCriteria
  userId: Identifier | null
}

export class GetActivitiesQueryResponseDtoTranslator
  implements ApplicationDtoTranslatorInterface<GetActivitiesResponseContext, GetActivitiesQueryResponseDto>
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

      let location: LocationQueryDto | null = null

      if (rawData.location_geojson) {
        location = new LocationQueryDtoTranslator().translate({
          lng: String(rawData.location_geojson.coordinates[0]),
          lat: String(rawData.location_geojson.coordinates[1]),
        })
      }

      let duration: { min: MagnitudeQueryDto; max: MagnitudeQueryDto } | null = null

      if (rawData.min_duration && rawData.max_duration) {
        duration = {
          min: new DurationQueryDtoTranslator().translate({
            value: String(rawData.min_duration),
            normalizedValue: String(rawData.min_duration),
            unit: Duration.DEFAULT_UNIT,
          }),
          max: new DurationQueryDtoTranslator().translate({
            value: String(rawData.max_duration),
            normalizedValue: String(rawData.max_duration),
            unit: Duration.DEFAULT_UNIT,
          }),
        }
      }

      let activityHost: ActivityHostQueryDto | null = null
      let currentParticipation: ActivityParticipationQueryDto | null = null

      if (rawData.host) {
        activityHost = new ActivityHostQueryDtoTranslator().translate(rawData.host)
      }

      if (rawData.current_participation) {
        currentParticipation = new ActivityParticipationQueryDtoTranslator().translate(rawData.current_participation)
      }

      let teamConfig: TeamConfigQueryDto | null = null

      if (rawData.team_config) {
        teamConfig = {
          minTeams: rawData.team_config.minTeams,
          maxTeams: rawData.team_config.maxTeams,
          playersPerTeam: rawData.team_config.playersPerTeam,
        }
      }

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
        createdAt: rawData.created_at.toISOString(),
        scheduledAt: rawData.scheduled_at.toISOString(),
        levels: new RankingChoiceQueryDtoTranslator().translate(rawData.levels),
        teamConfig,
        participation: currentParticipation,
        host: activityHost,
        sport: new SportQueryDtoTranslator().translate(rawData.sport),
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

    response.lat = activeFilters.location.lat.stringValue
    response.lng = activeFilters.location.lng.stringValue
    response.radius = activeFilters.radius.value
    response.statuses = activeFilters.statuses.map((activityStatus) => activityStatus.value)

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
