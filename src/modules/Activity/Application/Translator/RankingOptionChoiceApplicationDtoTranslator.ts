import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/SportRankingSystem'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { RankingOptionChoiceApplicationDto } from '~/src/modules/Activity/Application/Dto/RankingOptionChoiceApplicationDto'
import { RankingOptionApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/RankingOptionApplicationDtoTranslator'

export class RankingOptionChoiceApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<Array<SportRankingSystem>, RankingOptionChoiceApplicationDto>
{
  public translate(domain: Array<SportRankingSystem>): RankingOptionChoiceApplicationDto {
    return {
      type: 'choice',
      values: domain.map((option) => new RankingOptionApplicationDtoTranslator().translate(option)),
    }
  }
}
