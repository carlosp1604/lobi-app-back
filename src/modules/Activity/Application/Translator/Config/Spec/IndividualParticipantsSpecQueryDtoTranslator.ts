import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { IndividualParticipantsConfigQueryDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'
import { IndividualParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { IndividualParticipantsConfigQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/IndividualParticipantsConfigQueryDtoTranslator'

export class IndividualParticipantsSpecQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<IndividualParticipantsSpecPrimitives, IndividualParticipantsConfigQueryDto>
{
  public translate(primitives: IndividualParticipantsSpecPrimitives): IndividualParticipantsConfigQueryDto {
    return new IndividualParticipantsConfigQueryDtoTranslator().translate(primitives)
  }
}
