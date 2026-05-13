import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { IndividualParticipantsConfigQueryDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'
import { IndividualParticipantsConfigPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsConfig'

export class IndividualParticipantsConfigQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<IndividualParticipantsConfigPrimitives, IndividualParticipantsConfigQueryDto>
{
  public translate(primitives: IndividualParticipantsConfigPrimitives): IndividualParticipantsConfigQueryDto {
    return {
      type: 'individual',
      maxPlayers: primitives.maxPlayers,
      minPlayers: primitives.minPlayers,
    }
  }
}
