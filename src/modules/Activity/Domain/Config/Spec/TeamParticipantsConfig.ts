import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { ParticipationStrategy } from '~/src/modules/Activity/Domain/ParticipationStrategy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'

export interface TeamParticipantsConfigProps {
  minTeams: IntegerNumber
  maxTeams: IntegerNumber
  minPlayers: IntegerNumber
  playersPerTeam: IntegerNumber
}

export interface TeamParticipantsConfigPrimitives {
  minTeams: number
  maxTeams: number
  minPlayers: number
  playersPerTeam: number
}

export interface TeamParticipantsConfigInputProps {
  minTeams: number
  maxTeams: number
  minPlayers?: number
  playersPerTeam: number
}

export class TeamParticipantsConfig
  extends ValueObject<TeamParticipantsConfigProps>
  implements SerializableInterface<TeamParticipantsConfigPrimitives>, ParticipationStrategy
{
  private __teamParticipantsConfigBrand: void

  public static readonly MIN_PLAYERS_REQUIRED = PARTICIPATION_LIMITS.MIN_PLAYERS
  public static readonly MIN_TEAMS_REQUIRED = PARTICIPATION_LIMITS.MIN_TEAMS
  public static readonly MAX_TEAMS_ALLOWED = PARTICIPATION_LIMITS.MAX_TEAMS
  public static readonly MIN_PLAYERS_PER_TEAM_REQUIRED = PARTICIPATION_LIMITS.MIN_PLAYERS_PER_TEAM
  public static readonly MAX_PLAYERS_PER_TEAM_ALLOWED = PARTICIPATION_LIMITS.MAX_PLAYERS_PER_TEAM

  private constructor(props: TeamParticipantsConfigProps) {
    super(props)
  }

  public static safeCreate(props: TeamParticipantsConfigInputProps): Result<TeamParticipantsConfig, SportDomainException> {
    const playersPerTeamResult = IntegerNumber.safeCreate(props.playersPerTeam)

    if (!playersPerTeamResult.success) {
      return fail(
        SportDomainException.invalidPlayersPerTeamRange(
          props.playersPerTeam,
          this.MIN_PLAYERS_PER_TEAM_REQUIRED.value,
          this.MAX_PLAYERS_PER_TEAM_ALLOWED.value,
        ),
      )
    }

    const playersPerTeam = playersPerTeamResult.value

    if (
      playersPerTeam.isLessThan(this.MIN_PLAYERS_PER_TEAM_REQUIRED) ||
      playersPerTeam.isGreaterThan(this.MAX_PLAYERS_PER_TEAM_ALLOWED)
    ) {
      return fail(
        SportDomainException.invalidPlayersPerTeamRange(
          playersPerTeam.value,
          this.MIN_PLAYERS_PER_TEAM_REQUIRED.value,
          this.MAX_PLAYERS_PER_TEAM_ALLOWED.value,
        ),
      )
    }

    const minTeamsResult = IntegerNumber.safeCreate(props.minTeams)

    if (!minTeamsResult.success) {
      return this.failTeamsRange(props.minTeams, props.maxTeams)
    }

    const minTeams = minTeamsResult.value

    const maxTeamsResult = IntegerNumber.safeCreate(props.maxTeams)

    if (!maxTeamsResult.success) {
      return this.failTeamsRange(minTeams.value, props.maxTeams)
    }

    const maxTeams = maxTeamsResult.value

    if (
      minTeams.isLessThan(this.MIN_TEAMS_REQUIRED) ||
      minTeams.isGreaterThan(this.MAX_TEAMS_ALLOWED) ||
      maxTeams.isGreaterThan(this.MAX_TEAMS_ALLOWED) ||
      minTeams.isGreaterThan(maxTeams)
    ) {
      return this.failTeamsRange(minTeams.value, maxTeams.value)
    }

    const realMinPlayersRequired = minTeams.multiply(playersPerTeam)

    const minPlayersResult =
      props.minPlayers !== undefined ? IntegerNumber.safeCreate(props.minPlayers) : success(realMinPlayersRequired)

    if (!minPlayersResult.success) return this.failMinPlayers(props.minPlayers!, realMinPlayersRequired.value)
    const minPlayers = minPlayersResult.value

    if (minPlayers.isLessThan(this.MIN_PLAYERS_REQUIRED) || minPlayers.isGreaterThan(realMinPlayersRequired)) {
      return this.failMinPlayers(minPlayers.value, realMinPlayersRequired.value)
    }

    return success(new TeamParticipantsConfig({ minTeams, maxTeams, playersPerTeam, minPlayers }))
  }

  public static create(props: TeamParticipantsConfigInputProps): TeamParticipantsConfig {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: TeamParticipantsConfigPrimitives): TeamParticipantsConfig {
    return TeamParticipantsConfig.create({
      minTeams: primitives.minTeams,
      maxTeams: primitives.maxTeams,
      minPlayers: primitives.minPlayers,
      playersPerTeam: primitives.playersPerTeam,
    })
  }

  private static failTeamsRange(min: number, max: number) {
    return fail(SportDomainException.invalidTeamsRange(min, max, this.MIN_TEAMS_REQUIRED.value, this.MAX_TEAMS_ALLOWED.value))
  }

  private static failMinPlayers(val: number, realMax: number) {
    return fail(SportDomainException.invalidTeamsMinPlayers(val, this.MIN_PLAYERS_REQUIRED.value, realMax))
  }

  public equals(vo?: TeamParticipantsConfig | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const { maxTeams, minTeams, minPlayers, playersPerTeam } = this._value

    return (
      minTeams.equals(vo._value.minTeams) &&
      maxTeams.equals(vo._value.maxTeams) &&
      minPlayers.equals(vo._value.minPlayers) &&
      playersPerTeam.equals(vo._value.playersPerTeam)
    )
  }

  public toString(): string {
    const { maxTeams, minTeams, minPlayers, playersPerTeam } = this._value

    return `Teams: ${minTeams.toString()}-${maxTeams.toString()}. Players per team: ${playersPerTeam.toString()}. Min to play: ${minPlayers.value}`
  }

  get minCapacity(): IntegerNumber {
    return this._value.minPlayers
  }

  get maxCapacity(): IntegerNumber {
    return this._value.maxTeams.multiply(this._value.playersPerTeam)
  }

  get minTeams(): IntegerNumber {
    return this._value.minTeams
  }

  get maxTeams(): IntegerNumber {
    return this._value.maxTeams
  }

  get playersPerTeam(): IntegerNumber {
    return this._value.playersPerTeam
  }

  get minToPlay(): IntegerNumber {
    return this._value.minPlayers
  }

  public toPrimitives(): TeamParticipantsConfigPrimitives {
    const { maxTeams, minTeams, minPlayers, playersPerTeam } = this._value

    return {
      maxTeams: maxTeams.toPrimitives(),
      minTeams: minTeams.toPrimitives(),
      minPlayers: minPlayers.toPrimitives(),
      playersPerTeam: playersPerTeam.toPrimitives(),
    }
  }
}
