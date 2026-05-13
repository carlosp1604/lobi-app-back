import { SportQueryDto } from '~/src/modules/Activity/Application/Dto/Sport/SportQueryDto'
import { SportReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportReadModel'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class SportQueryDtoTranslator implements ApplicationDtoTranslatorInterface<SportReadModel, SportQueryDto> {
  public translate(data: SportReadModel): SportQueryDto {
    return {
      id: data.id,
      slug: data.slug,
      imageUrl: data.imageUrl,
    }
  }
}
