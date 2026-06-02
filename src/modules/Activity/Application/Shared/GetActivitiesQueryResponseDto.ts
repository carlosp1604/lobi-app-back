import { SportDto } from '~/src/modules/Activity/Application/Dto/Sport/SportDto'
import { SportLevelDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelDto'
import { ActivityHostDto } from '~/src/modules/Activity/Application/Dto/ActivityHostDto'
import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { LocationDto, MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'

export type GetActivitiesQueryActiveFiltersDto = Record<string, unknown>
export interface GetActivitiesQueryPaginationDto {
  readonly page: number
  readonly perPage: number
}
export interface GetActivitiesQuerySortDto {
  readonly direction: string
  readonly by: string
}

export interface TeamConfigQueryDto {
  readonly minTeams: number
  readonly maxTeams: number
  readonly playersPerTeam: number
}

export interface ActivityListItemQueryDto {
  readonly id: string
  readonly title: string
  readonly description: string | null
  readonly status: string
  readonly location: LocationDto | null
  readonly capacity: {
    readonly min: number
    readonly max: number
  }
  readonly duration: {
    readonly min: MagnitudeDto
    readonly max: MagnitudeDto
  } | null
  readonly currentParticipants: number
  readonly createdAt: string
  readonly scheduledAt: string
  readonly levels: Array<SportLevelDto>
  readonly teamConfig: TeamConfigQueryDto | null
  readonly participation: ActivityParticipationDto | null
  readonly host: ActivityHostDto | null
  readonly sport: SportDto
  readonly isHost: boolean
  readonly isParticipant: boolean
}

export interface GetActivitiesQueryResponseDto {
  readonly items: Array<ActivityListItemQueryDto>
  readonly activeFilters: GetActivitiesQueryActiveFiltersDto
  readonly pagination: GetActivitiesQueryPaginationDto
  readonly sort: GetActivitiesQuerySortDto
  readonly hasNext: boolean
  readonly hasPrevious: boolean
  readonly total: number
}
