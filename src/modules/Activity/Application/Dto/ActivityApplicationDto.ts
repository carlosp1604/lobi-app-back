import { LocationApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { ActivityConfigApplicationDto } from '~/src/modules/Activity/Application/Dto/ActivityConfigApplicationDto'
import { RankingOptionApplicationDto } from '~/src/modules/Activity/Application/Dto/RankingOptionApplicationDto'

export interface ActivityApplicationDto {
  readonly id: string
  readonly title: string
  readonly description: string | null
  readonly sportId: string
  readonly hostId: string
  readonly status: string
  readonly location: LocationApplicationDto | null
  readonly maxCapacity: number
  readonly minCapacity: number
  readonly minDuration: number | null
  readonly maxDuration: number | null
  readonly currentParticipants: number
  readonly scheduledAt: Date
  readonly config: ActivityConfigApplicationDto
  readonly levels: Array<RankingOptionApplicationDto>
}
