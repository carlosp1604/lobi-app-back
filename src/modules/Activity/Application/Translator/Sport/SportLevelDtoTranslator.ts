import { SportLevelDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelDto'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class SportLevelDtoTranslator implements DtoTranslatorInterface<SportLevelReadModel, SportLevelDto> {
  public translate(readModel: SportLevelReadModel): SportLevelDto {
    return {
      id: readModel.id,
      slug: readModel.slug,
      order: readModel.order,
      imageUrl: readModel.imageUrl,
    }
  }
}
