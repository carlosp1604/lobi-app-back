import { TeamParticipation } from '~/src/modules/Activity/Domain/Sport/TeamParticipation'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { TeamParticipationConfigurationApplicationDto } from '~/src/modules/Activity/Application/Dto/ParticipationConfigurationApplicationDto'

export class TeamParticipationConfigurationApplication
  implements ApplicationDtoTranslatorInterface<TeamParticipation, TeamParticipationConfigurationApplicationDto>
{
  public translate(domain: TeamParticipation): TeamParticipationConfigurationApplicationDto {
    return {
      type: 'team',
      minCapacity: domain.minCapacity.value,
      maxCapacity: domain.maxCapacity.value,
      minTeams: domain.minTeams.value,
      maxTeams: domain.maxTeams.value,
      playersPerTeam: domain.playersPerTeam.value,
      minToPlay: domain.minToPlay.value,
    }
  }
}
