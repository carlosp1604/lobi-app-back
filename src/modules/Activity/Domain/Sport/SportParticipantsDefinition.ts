import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export interface TeamsModuleConfig {
  defaultTeams: number
  defaultPlayersPerTeam: number
}

export interface SportParticipantsDefinitionProps {
  defaultMinPlayers: number
  teamsModule?: TeamsModuleConfig
}

export class SportParticipantsDefinition extends ValueObject<SportParticipantsDefinitionProps> {
  public static readonly MIN_DEFAULT_PLAYERS = 1
  public static readonly MAX_DEFAULT_PLAYERS = 1000

  public static readonly MIN_TEAMS = 2
  public static readonly MAX_TEAMS = 10
  public static readonly MIN_PLAYERS_PER_TEAM = 1
  public static readonly MAX_PLAYERS_PER_TEAM = 50

  private constructor(props: SportParticipantsDefinitionProps) {
    super(props)
  }

  public static safeCreate(props: SportParticipantsDefinitionProps): Result<SportParticipantsDefinition, SportDomainException> {
    const { defaultMinPlayers } = props

    if (defaultMinPlayers < this.MIN_DEFAULT_PLAYERS || defaultMinPlayers > this.MAX_DEFAULT_PLAYERS) {
      return fail(
        SportDomainException.invalidParticipantsDefinition(defaultMinPlayers, this.MIN_DEFAULT_PLAYERS, this.MAX_DEFAULT_PLAYERS),
      )
    }

    if (props.teamsModule) {
      const { defaultTeams, defaultPlayersPerTeam } = props.teamsModule

      if (defaultTeams < this.MIN_TEAMS || defaultTeams > this.MAX_TEAMS) {
        return fail(SportDomainException.invalidTeamsDefinition(defaultTeams, this.MIN_TEAMS, this.MAX_TEAMS))
      }

      if (defaultPlayersPerTeam < this.MIN_PLAYERS_PER_TEAM || defaultPlayersPerTeam > this.MAX_PLAYERS_PER_TEAM) {
        return fail(
          SportDomainException.invalidPlayersPerTeamDefinition(
            defaultPlayersPerTeam,
            this.MIN_PLAYERS_PER_TEAM,
            this.MAX_PLAYERS_PER_TEAM,
          ),
        )
      }

      const isValidTeamsDefinition = defaultTeams * defaultPlayersPerTeam === defaultMinPlayers

      if (!isValidTeamsDefinition) {
        return fail(SportDomainException.teamsDefinitionMismatch(defaultMinPlayers, defaultTeams, defaultPlayersPerTeam))
      }
    }

    return success(new SportParticipantsDefinition(props))
  }

  public static fromProps(props: SportParticipantsDefinitionProps): SportParticipantsDefinition {
    const participantsDefinitionResult = this.safeCreate(props)

    if (!participantsDefinitionResult.success) {
      throw participantsDefinitionResult.error
    }

    return participantsDefinitionResult.value
  }

  get defaultMinPlayers(): number {
    return this._value.defaultMinPlayers
  }

  get teamsModule(): TeamsModuleConfig | undefined {
    return this._value.teamsModule
  }
}
