import { ActivityApplicationDto } from '~/src/modules/Activity/Application/Dto/ActivityApplicationDto'
import { ParticipationApplicationDto } from '~/src/modules/Activity/Application/Dto/ParticipationApplicationDto'

export interface CreateActivityApplicationResponseDto {
  readonly activity: ActivityApplicationDto
  readonly participation: ParticipationApplicationDto
  readonly isUserAdmin: boolean
  readonly isUserParticipating: boolean
}
