import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { TeamParticipantsConfigDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigDto'
import { TeamParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { TeamParticipantsConfigDtoTranslator } from '~/src/modules/Activity/Application/Translator/TeamParticipantsConfigDtoTranslator'

export class TeamParticipantsSpecQueryDtoTranslator
  implements DtoTranslatorInterface<TeamParticipantsSpecPrimitives, TeamParticipantsConfigDto>
{
  public translate(primitives: TeamParticipantsSpecPrimitives): TeamParticipantsConfigDto {
    return new TeamParticipantsConfigDtoTranslator().translate(primitives)
  }
}
