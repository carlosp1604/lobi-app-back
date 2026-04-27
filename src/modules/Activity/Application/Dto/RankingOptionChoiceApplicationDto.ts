import { RankingOptionApplicationDto } from '~/src/modules/Activity/Application/Dto/RankingOptionApplicationDto'

export interface RankingOptionChoiceApplicationDto {
  readonly type: 'choice'
  readonly values: Array<RankingOptionApplicationDto>
}
