import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/SportRankingSystem'
import { RankingOptionApplicationDto } from '~/src/modules/Activity/Application/Dto/RankingOptionApplicationDto'

export class RankingOptionApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<SportRankingSystem, RankingOptionApplicationDto>
{
  public translate(domain: SportRankingSystem): RankingOptionApplicationDto {
    return {
      id: domain.id.value,
      slug: domain.slug.value,
      order: domain.order,
      imageUrl: domain.imageUrl ? domain.imageUrl.value : null,
    }
  }
}
