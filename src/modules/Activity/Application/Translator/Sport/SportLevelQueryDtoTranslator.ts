import { SportLevelQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelQueryDto'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class SportLevelQueryDtoTranslator implements ApplicationDtoTranslatorInterface<SportLevelReadModel, SportLevelQueryDto> {
  public translate(readModel: SportLevelReadModel): SportLevelQueryDto {
    return {
      id: readModel.id,
      slug: readModel.slug,
      order: readModel.order,
      imageUrl: readModel.imageUrl,
    }
  }
}
