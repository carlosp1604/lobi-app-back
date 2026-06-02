import { SportDto } from '~/src/modules/Activity/Application/Dto/Sport/SportDto'
import { SportReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportReadModel'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class SportDtoTranslator implements DtoTranslatorInterface<SportReadModel, SportDto> {
  public translate(data: SportReadModel): SportDto {
    return {
      id: data.id,
      slug: data.slug,
      imageUrl: data.imageUrl,
    }
  }
}
