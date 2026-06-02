import { SportDto } from '~/src/modules/Activity/Application/Dto/Sport/SportDto'
import { SportLevelDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelDto'
import { ActivityHostDto } from '~/src/modules/Activity/Application/Dto/ActivityHostDto'
import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { LocationDto, MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'

export interface ActivityConfigDto {
  readonly capabilities: Record<string, unknown>
  readonly specs: Record<string, unknown>
}

export interface ActivityDetailsDto {
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
  readonly activityConfig: ActivityConfigDto
  readonly levels: Array<SportLevelDto>
}

export interface GetActivityResponseDto {
  readonly activity: ActivityDetailsDto
  readonly participation: ActivityParticipationDto | null
  readonly host: ActivityHostDto | null
  readonly sport: SportDto
  readonly isHost: boolean
  readonly isParticipant: boolean
}
