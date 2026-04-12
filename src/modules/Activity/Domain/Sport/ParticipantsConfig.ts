import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export interface TeamsConfig {
  minTeams: number
  maxTeams: number
  playersPerTeam: number
}

export interface ParticipantsConfigProps {
  minPlayersToPlay: number
  maxPlayers: number
  teams?: TeamsConfig
}

export class ParticipantsConfig {
  private constructor(private readonly props: ParticipantsConfigProps) {}

  get minPlayersToPlay(): number {
    return this.props.minPlayersToPlay
  }

  get maxPlayers(): number {
    return this.props.maxPlayers
  }

  get teams(): TeamsConfig | undefined {
    return this.props.teams
  }

  // La capacidad máxima absoluta de la actividad
  get maxCapacity(): number {
    if (this.props.teams) {
      return this.props.teams.maxTeams * this.props.teams.playersPerTeam
    }
    return this.props.maxPlayers
  }

  // El mínimo absoluto para que la actividad no se cancele
  get minCapacity(): number {
    return this.props.minPlayersToPlay
  }

  public static safeCreate(props: ParticipantsConfigProps): Result<ParticipantsConfig, Error> {
    // 1. Validaciones si el deporte tiene módulo de equipos
    if (props.teams) {
      if (props.teams.minTeams < 2) {
        return fail(new Error('A match must have at least a minimum of 2 teams or sides.'))
      }

      if (props.teams.maxTeams < props.teams.minTeams) {
        return fail(new Error('The maximum number of teams cannot be less than the minimum.'))
      }

      if (props.teams.playersPerTeam < 1) {
        return fail(new Error('A team must have at least 1 player.'))
      }

      const teamMaxCapacity = props.teams.maxTeams * props.teams.playersPerTeam

      if (teamMaxCapacity > props.maxPlayers) {
        return fail(
          new Error(
            `Team max capacity (${teamMaxCapacity}) cannot exceed the absolute max players of the sport (${props.maxPlayers}).`,
          ),
        )
      }
    }

    // 2. Validaciones universales
    if (props.minPlayersToPlay < 1) {
      return fail(new Error('An activity requires at least 1 player to be playable.'))
    }

    const currentMaxCapacity = props.teams ? props.teams.maxTeams * props.teams.playersPerTeam : props.maxPlayers

    if (props.minPlayersToPlay > currentMaxCapacity) {
      return fail(new Error(`Minimum players (${props.minPlayersToPlay}) cannot exceed the maximum capacity (${currentMaxCapacity}).`))
    }

    return success(new ParticipantsConfig(props))
  }
}
