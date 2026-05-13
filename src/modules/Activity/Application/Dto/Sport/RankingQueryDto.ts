import { SportLevelQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelQueryDto'

export type RankingType = 'option' | 'multiple-choice'

export interface RankingOptionQueryDto {
  readonly type: RankingType
  readonly level: SportLevelQueryDto
}

export interface RankingChoiceQueryDto {
  readonly type: RankingType
  readonly selected: Array<RankingOptionQueryDto>
}
