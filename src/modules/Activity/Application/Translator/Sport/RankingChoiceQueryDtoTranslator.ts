import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { RankingChoiceQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/RankingQueryDto'
import { RankingOptionQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/RankingOptionQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class RankingChoiceQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<Array<SportLevelReadModel>, RankingChoiceQueryDto>
{
  public translate(readModels: Array<SportLevelReadModel>): RankingChoiceQueryDto {
    return {
      type: 'multiple-choice',
      selected: readModels.map((level) => new RankingOptionQueryDtoTranslator().translate(level)),
    }
  }
}
