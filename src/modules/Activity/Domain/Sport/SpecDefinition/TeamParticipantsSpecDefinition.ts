import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'

export interface TeamParticipantsDefinitionInputProps {
  defaultMinPlayers: number
  defaultTeams: number
  defaultPlayersPerTeam: number
}

export interface TeamParticipantsDefinitionProps {
  defaultMinPlayers: IntegerNumber
  defaultTeams: IntegerNumber
  defaultPlayersPerTeam: IntegerNumber
}

export class TeamParticipantsSpecDefinition extends ValueObject<TeamParticipantsDefinitionProps> {
  private __teamParticipantsSpecDefinition: void

  public static readonly MIN_DEFAULT_PLAYERS = PARTICIPATION_LIMITS.MIN_PLAYERS
  public static readonly MAX_DEFAULT_PLAYERS = PARTICIPATION_LIMITS.MAX_PLAYERS
  public static readonly MIN_TEAMS = PARTICIPATION_LIMITS.MIN_TEAMS
  public static readonly MAX_TEAMS = PARTICIPATION_LIMITS.MAX_TEAMS
  public static readonly MIN_PLAYERS_PER_TEAM = PARTICIPATION_LIMITS.MIN_PLAYERS_PER_TEAM
  public static readonly MAX_PLAYERS_PER_TEAM = PARTICIPATION_LIMITS.MAX_PLAYERS_PER_TEAM

  private constructor(props: TeamParticipantsDefinitionProps) {
    super(props)
  }

  public static safeCreate(props: TeamParticipantsDefinitionInputProps): Result<TeamParticipantsSpecDefinition, SportDomainException> {
    const { defaultMinPlayers, defaultTeams, defaultPlayersPerTeam } = props

    const defaultMinPlayersResult = IntegerNumber.safeCreate(defaultMinPlayers)

    if (!defaultMinPlayersResult.success) {
      return fail(
        SportDomainException.invalidTeamDefaultPlayersDefinition(
          props.defaultMinPlayers,
          this.MIN_DEFAULT_PLAYERS.value,
          this.MAX_DEFAULT_PLAYERS.value,
        ),
      )
    }

    const defaultPlayers = defaultMinPlayersResult.value

    if (defaultPlayers.isLessThan(this.MIN_DEFAULT_PLAYERS) || defaultPlayers.isGreaterThan(this.MAX_DEFAULT_PLAYERS)) {
      return fail(
        SportDomainException.invalidTeamDefaultPlayersDefinition(
          defaultPlayers.value,
          this.MIN_DEFAULT_PLAYERS.value,
          this.MAX_DEFAULT_PLAYERS.value,
        ),
      )
    }

    const defaultTeamsResult = IntegerNumber.safeCreate(defaultTeams)

    if (!defaultTeamsResult.success) {
      return fail(SportDomainException.invalidTeamsRangeDefinition(defaultTeams, this.MIN_TEAMS.value, this.MAX_TEAMS.value))
    }

    const teamsNumber = defaultTeamsResult.value

    if (teamsNumber.isLessThan(this.MIN_TEAMS) || teamsNumber.isGreaterThan(this.MAX_TEAMS)) {
      return fail(SportDomainException.invalidTeamsRangeDefinition(teamsNumber.value, this.MIN_TEAMS.value, this.MAX_TEAMS.value))
    }

    const playersPerTeamResult = IntegerNumber.safeCreate(defaultPlayersPerTeam)

    if (!playersPerTeamResult.success) {
      return fail(
        SportDomainException.invalidPlayersPerTeamDefinition(
          defaultPlayersPerTeam,
          this.MIN_PLAYERS_PER_TEAM.value,
          this.MAX_PLAYERS_PER_TEAM.value,
        ),
      )
    }

    const playersPerTeam = playersPerTeamResult.value

    if (playersPerTeam.isLessThan(this.MIN_PLAYERS_PER_TEAM) || playersPerTeam.isGreaterThan(this.MAX_PLAYERS_PER_TEAM)) {
      return fail(
        SportDomainException.invalidPlayersPerTeamDefinition(
          playersPerTeam.value,
          this.MIN_PLAYERS_PER_TEAM.value,
          this.MAX_PLAYERS_PER_TEAM.value,
        ),
      )
    }

    const isValidTeamsDefinition = teamsNumber.multiply(playersPerTeam).equals(defaultPlayers)

    if (!isValidTeamsDefinition) {
      return fail(SportDomainException.teamsDefinitionMismatch(defaultPlayers.value, teamsNumber.value, playersPerTeam.value))
    }

    return success(
      new TeamParticipantsSpecDefinition({
        defaultMinPlayers: defaultPlayers,
        defaultTeams: teamsNumber,
        defaultPlayersPerTeam: playersPerTeam,
      }),
    )
  }

  public static create(props: TeamParticipantsDefinitionInputProps): TeamParticipantsSpecDefinition {
    const participantsDefinitionResult = this.safeCreate(props)

    if (!participantsDefinitionResult.success) {
      throw participantsDefinitionResult.error
    }

    return participantsDefinitionResult.value
  }

  public equals(vo?: TeamParticipantsSpecDefinition | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    const { defaultMinPlayers, defaultTeams, defaultPlayersPerTeam } = this._value

    return (
      defaultMinPlayers.equals(vo._value.defaultMinPlayers) &&
      defaultTeams.equals(vo._value.defaultTeams) &&
      defaultPlayersPerTeam.equals(vo._value.defaultPlayersPerTeam)
    )
  }

  public toString(): string {
    const { defaultMinPlayers, defaultTeams, defaultPlayersPerTeam } = this._value

    return `Team Participants definition: ${defaultMinPlayers.toString()} players, teams: ${defaultTeams.toString()}, player per team: ${defaultPlayersPerTeam.toString()}`
  }
}
