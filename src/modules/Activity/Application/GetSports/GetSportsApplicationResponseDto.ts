import { SportApplicationDto } from '~/src/modules/Activity/Application/Dto/SportApplicationDto'

export interface GetSportsApplicationResponseDto {
  readonly sports: Array<SportApplicationDto>
  readonly count: number
}
