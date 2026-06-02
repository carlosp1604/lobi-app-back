import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { IndividualParticipantsConfigDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigDto'
import { IndividualParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { IndividualParticipantsConfigDtoTranslator } from '~/src/modules/Activity/Application/Translator/IndividualParticipantsConfigDtoTranslator'

export class IndividualParticipantsSpecQueryDtoTranslator
  implements DtoTranslatorInterface<IndividualParticipantsSpecPrimitives, IndividualParticipantsConfigDto>
{
  public translate(primitives: IndividualParticipantsSpecPrimitives): IndividualParticipantsConfigDto {
    return new IndividualParticipantsConfigDtoTranslator().translate(primitives)
  }
}
