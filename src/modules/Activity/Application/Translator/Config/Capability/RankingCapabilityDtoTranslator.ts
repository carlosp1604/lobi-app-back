import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { MultipleChoiceCapabilityDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'
import { RankingCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'

export class RankingCapabilityDtoTranslator
  implements DtoTranslatorInterface<RankingCapabilityPrimitives, MultipleChoiceCapabilityDto>
{
  public static readonly capabilityName = 'ranking'

  public translate(primitives: RankingCapabilityPrimitives): MultipleChoiceCapabilityDto {
    return {
      type: 'multiple_choice',
      name: RankingCapabilityDtoTranslator.capabilityName,
      data: {
        ids: primitives.ids,
      },
    }
  }
}
