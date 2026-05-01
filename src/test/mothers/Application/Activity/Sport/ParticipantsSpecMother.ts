import { ParticipantsRawData } from '~/src/modules/Activity/Application/Sport/Specs/ParticipantsSpec'

export class ParticipantsSpecMother {
  static validData(): ParticipantsRawData {
    return {
      minPlayersToPlay: 10,
      maxPlayers: 10,
      teams: {
        minTeams: 2,
        maxTeams: 2,
        playersPerTeam: 5,
      },
    }
  }

  static invalidData(): ParticipantsRawData {
    return {
      minPlayersToPlay: 24,
      maxPlayers: 10,
      teams: {
        minTeams: 2,
        maxTeams: 3,
        playersPerTeam: 6,
      },
    }
  }

  static invalidStructure(): { players: number; teams: number } {
    return {
      players: 20,
      teams: 2,
    }
  }
}
