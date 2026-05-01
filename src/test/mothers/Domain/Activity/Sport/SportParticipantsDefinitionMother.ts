import {
  SportParticipantsDefinition,
  SportParticipantsDefinitionProps,
} from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'

type ParticipantsDefinitionType = 'individual' | 'team'

export class SportParticipantsDefinitionMother {
  public static valid(participantsType: ParticipantsDefinitionType = 'individual'): SportParticipantsDefinition {
    return SportParticipantsDefinition.fromProps({
      defaultMinPlayers: 10,
      teamsModule: participantsType === 'team' ? { defaultTeams: 2, defaultPlayersPerTeam: 5 } : undefined,
    })
  }

  public static validProps(participantsType: ParticipantsDefinitionType = 'individual'): SportParticipantsDefinitionProps {
    return {
      defaultMinPlayers: 10,
      teamsModule: participantsType === 'team' ? { defaultTeams: 2, defaultPlayersPerTeam: 5 } : undefined,
    }
  }

  public static invalidProps(participantsType: ParticipantsDefinitionType = 'individual'): SportParticipantsDefinitionProps {
    if (participantsType === 'individual') {
      return { defaultMinPlayers: 1 }
    }

    return {
      defaultMinPlayers: 10,
      teamsModule: {
        defaultTeams: 2,
        defaultPlayersPerTeam: 7,
      },
    }
  }

  static random(participantsType: ParticipantsDefinitionType = 'individual'): SportParticipantsDefinition {
    const defaultTeams = 2
    const defaultPlayersPerTeamOptions = [5, 6, 7, 8, 9, 10]
    const defaultMinPlayerOptions = [10, 12, 14, 16, 18, 20]

    if (participantsType === 'team') {
      const defaultPlayersPerTeam = defaultPlayersPerTeamOptions[Math.floor(Math.random() * defaultPlayersPerTeamOptions.length)]

      return SportParticipantsDefinition.fromProps({
        defaultMinPlayers: defaultPlayersPerTeam * defaultTeams,
        teamsModule: { defaultTeams, defaultPlayersPerTeam },
      })
    }

    const defaultMinPlayers = defaultMinPlayerOptions[Math.floor(Math.random() * defaultMinPlayerOptions.length)]

    return SportParticipantsDefinition.fromProps({
      defaultMinPlayers,
    })
  }
}
