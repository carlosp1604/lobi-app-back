import { RankingCapabilityQueryDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/RankingCapabilityQueryDto'
import { RankingCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class RankingCapabilityQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<RankingCapabilityPrimitives, RankingCapabilityQueryDto>
{
  constructor() {}

  public translate(primitives: RankingCapabilityPrimitives): RankingCapabilityQueryDto {
    return primitives
  }
}
