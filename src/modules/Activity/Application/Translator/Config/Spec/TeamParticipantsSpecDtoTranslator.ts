import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { TeamParticipantsSpecDto } from '~/src/modules/Activity/Application/Dto/Config/Spec/SpecDto'
import { TeamParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { TeamParticipantsConfigDtoTranslator } from '~/src/modules/Activity/Application/Translator/TeamParticipantsConfigDtoTranslator'

export class TeamParticipantsSpecDtoTranslator
  implements DtoTranslatorInterface<TeamParticipantsSpecPrimitives, TeamParticipantsSpecDto>
{
  public static readonly specName = 'team_participants'

  public translate(primitives: TeamParticipantsSpecPrimitives): TeamParticipantsSpecDto {
    return {
      name: TeamParticipantsSpecDtoTranslator.specName,
      data: new TeamParticipantsConfigDtoTranslator().translate(primitives),
    }
  }
}
