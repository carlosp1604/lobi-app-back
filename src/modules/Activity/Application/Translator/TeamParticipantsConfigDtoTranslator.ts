import { TeamParticipantsConfigQueryDto } from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'
import { TeamParticipantsConfigPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsConfig'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class TeamParticipantsConfigQueryDtoTranslator
  implements DtoTranslatorInterface<TeamParticipantsConfigPrimitives, TeamParticipantsConfigQueryDto>
{
  public translate(primitives: TeamParticipantsConfigPrimitives): TeamParticipantsConfigQueryDto {
    return {
      type: 'team',
      minPlayers: primitives.minPlayers,
      minTeams: primitives.minTeams,
      maxTeams: primitives.maxTeams,
      playersPerTeam: primitives.playersPerTeam,
    }
  }
}
