import { RankingChoiceQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/RankingQueryDto'
import { LocationQueryDto, MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ActivityHostQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityHostQueryDto'
import { ActivityParticipationQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationQueryDto'
import { SportQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportQueryDto'

export interface ActivityConfigQueryDto {
  readonly capabilities: Record<string, unknown>
  readonly specs: Record<string, unknown>
}

export interface ActivityDetailsQueryDto {
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
  readonly createdAt: Date
  readonly scheduledAt: Date
  readonly activityConfig: ActivityConfigQueryDto
  readonly levels: RankingChoiceQueryDto
}

export interface GetActivityQueryResponseDto {
  readonly activity: ActivityDetailsQueryDto
  readonly participation: ActivityParticipationQueryDto | null
  readonly host: ActivityHostQueryDto | null
  readonly sport: SportQueryDto
  readonly isHost: boolean
  readonly isParticipant: boolean
}
