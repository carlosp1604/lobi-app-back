import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { TeamParticipantsConfigDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigDto'
import { TeamParticipantsConfigPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsConfig'

export class TeamParticipantsConfigDtoTranslator
  implements DtoTranslatorInterface<TeamParticipantsConfigPrimitives, TeamParticipantsConfigDto>
{
  public translate(primitives: TeamParticipantsConfigPrimitives): TeamParticipantsConfigDto {
    return {
      type: 'team',
      minPlayers: primitives.minPlayers,
      minTeams: primitives.minTeams,
      maxTeams: primitives.maxTeams,
      playersPerTeam: primitives.playersPerTeam,
    }
  }
}
