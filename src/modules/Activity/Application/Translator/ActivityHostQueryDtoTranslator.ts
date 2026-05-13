import { ActivityHostQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityHostQueryDto'
import { ActivityHostReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityHostReadModel'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class ActivityHostQueryDtoTranslator implements ApplicationDtoTranslatorInterface<ActivityHostReadModel, ActivityHostQueryDto> {
  public translate(readModel: ActivityHostReadModel): ActivityHostQueryDto {
    return {
      id: readModel.id,
      name: readModel.name,
      username: readModel.username,
    }
  }
}
