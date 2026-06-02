import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { IndividualParticipantsSpecDto } from '~/src/modules/Activity/Application/Dto/Config/Spec/SpecDto'
import { IndividualParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { IndividualParticipantsConfigDtoTranslator } from '~/src/modules/Activity/Application/Translator/IndividualParticipantsConfigDtoTranslator'

export class IndividualParticipantsSpecDtoTranslator
  implements DtoTranslatorInterface<IndividualParticipantsSpecPrimitives, IndividualParticipantsSpecDto>
{
  public static readonly specName = 'individual_participants'

  public translate(primitives: IndividualParticipantsSpecPrimitives): IndividualParticipantsSpecDto {
    return {
      name: IndividualParticipantsSpecDtoTranslator.specName,
      data: new IndividualParticipantsConfigDtoTranslator().translate(primitives),
    }
  }
}
