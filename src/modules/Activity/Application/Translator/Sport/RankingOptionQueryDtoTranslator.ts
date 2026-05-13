import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { SportLevelQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelQueryDto'
import { RankingOptionQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/RankingQueryDto'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { SportLevelQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportLevelQueryDtoTranslator'

export class RankingOptionQueryDtoTranslator implements ApplicationDtoTranslatorInterface<SportLevelReadModel, RankingOptionQueryDto> {
  public translate(readModel: SportLevelQueryDto): RankingOptionQueryDto {
    return {
      type: 'option',
      level: new SportLevelQueryDtoTranslator().translate(readModel),
    }
  }
}
