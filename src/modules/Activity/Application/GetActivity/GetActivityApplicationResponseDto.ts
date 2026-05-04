import { ActivityApplicationDto } from '~/src/modules/Activity/Application/Dto/ActivityApplicationDto'
import { ParticipationApplicationDto } from '~/src/modules/Activity/Application/Dto/ParticipationApplicationDto'

export interface ActivityHostDetailsApplicationDto {
  readonly id: string
  readonly name: string
  readonly username: string
  readonly userUploadId: string | null
}

export interface GetActivityApplicationResponseDto {
  readonly activity: ActivityApplicationDto
  readonly participation: ParticipationApplicationDto | null
  readonly hostActivity: ActivityHostDetailsApplicationDto | null
  readonly isHost: boolean
  readonly isParticipant: boolean
}
