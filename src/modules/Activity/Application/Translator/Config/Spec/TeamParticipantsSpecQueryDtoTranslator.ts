import { TeamParticipantsConfigQueryDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'
import { TeamParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { TeamParticipantsConfigQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/TeamParticipantsConfigQueryDtoTranslator'

export class TeamParticipantsSpecQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<TeamParticipantsSpecPrimitives, TeamParticipantsConfigQueryDto>
{
  public translate(primitives: TeamParticipantsSpecPrimitives): TeamParticipantsConfigQueryDto {
    return new TeamParticipantsConfigQueryDtoTranslator().translate(primitives)
  }
}
