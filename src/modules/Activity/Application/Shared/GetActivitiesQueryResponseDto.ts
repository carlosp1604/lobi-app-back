import { SportQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportQueryDto'
import { ActivityHostQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityHostQueryDto'
import { RankingChoiceQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/RankingQueryDto'
import { ActivityParticipationQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationQueryDto'
import { LocationQueryDto, MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'

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
  readonly location: LocationQueryDto | null
  readonly capacity: {
    readonly min: number
    readonly max: number
  }
  readonly duration: {
    readonly min: MagnitudeQueryDto
    readonly max: MagnitudeQueryDto
  } | null
  readonly currentParticipants: number
  readonly createdAt: string
  readonly scheduledAt: string
  readonly levels: RankingChoiceQueryDto
  readonly teamConfig: TeamConfigQueryDto | null
  readonly participation: ActivityParticipationQueryDto | null
  readonly host: ActivityHostQueryDto | null
  readonly sport: SportQueryDto
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
