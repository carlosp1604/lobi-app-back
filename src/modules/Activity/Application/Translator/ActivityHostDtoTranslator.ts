import { ActivityHostDto } from '~/src/modules/Activity/Application/Dto/ActivityHostDto'
import { ActivityHostReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityHostReadModel'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class ActivityHostQueryDtoTranslator implements DtoTranslatorInterface<ActivityHostReadModel, ActivityHostDto> {
  public translate(readModel: ActivityHostReadModel): ActivityHostDto {
    return {
      id: readModel.id,
      name: readModel.name,
      username: readModel.username,
    }
  }
}
