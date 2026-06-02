import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { IndividualParticipantsConfigDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigDto'
import { IndividualParticipantsConfigPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsConfig'

export class IndividualParticipantsConfigDtoTranslator
  implements DtoTranslatorInterface<IndividualParticipantsConfigPrimitives, IndividualParticipantsConfigDto>
{
  public translate(primitives: IndividualParticipantsConfigPrimitives): IndividualParticipantsConfigDto {
    return {
      type: 'individual',
      maxPlayers: primitives.maxPlayers,
      minPlayers: primitives.minPlayers,
    }
  }
}
