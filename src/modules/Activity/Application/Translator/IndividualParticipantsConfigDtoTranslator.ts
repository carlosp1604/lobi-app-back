import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { IndividualParticipantsConfigQueryDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'
import { IndividualParticipantsConfigPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsConfig'

export class IndividualParticipantsConfigQueryDtoTranslator
  implements DtoTranslatorInterface<IndividualParticipantsConfigPrimitives, IndividualParticipantsConfigQueryDto>
{
  public translate(primitives: IndividualParticipantsConfigPrimitives): IndividualParticipantsConfigQueryDto {
    return {
      type: 'individual',
      maxPlayers: primitives.maxPlayers,
      minPlayers: primitives.minPlayers,
    }
  }
}
