import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { IndividualParticipation } from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'

export interface TeamParticipationProps {
  minTeams: IntegerNumber
  maxTeams: IntegerNumber
  minPlayers: IntegerNumber
  playersPerTeam: IntegerNumber
}

export interface TeamParticipationPrimitiveProps {
  minTeams: number
  maxTeams: number
  minPlayers: number
  playersPerTeam: number
}

export interface TeamParticipationInputProps {
  minTeams?: number
  maxTeams?: number
  minPlayers?: number
  playersPerTeam: number
}

export class TeamParticipation extends ValueObject<TeamParticipationProps> {
  public readonly kind = 'team'
  private __teamParticipationBrand: void

  public static readonly MIN_TEAMS_REQUIRED = IntegerNumber.fromNumber(2)
  public static readonly MAX_TEAMS_ALLOWED = IntegerNumber.fromNumber(20)
  public static readonly MIN_PLAYERS_PER_TEAM_REQUIRED = IntegerNumber.fromNumber(1)
  public static readonly MAX_PLAYERS_PER_TEAM_ALLOWED = IntegerNumber.fromNumber(50)

  private constructor(props: TeamParticipationProps) {
    super(props)
  }

  public static safeCreate(props: TeamParticipationInputProps): Result<TeamParticipation, SportDomainException> {
    const playersPerTeamRes = IntegerNumber.safeCreate(props.playersPerTeam)

    if (!playersPerTeamRes.success) {
      return fail(
        SportDomainException.invalidPlayersPerTeamRange(
          props.playersPerTeam,
          this.MIN_PLAYERS_PER_TEAM_REQUIRED.value,
          this.MAX_PLAYERS_PER_TEAM_ALLOWED.value,
        ),
      )
    }

    const playersPerTeam = playersPerTeamRes.value

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

    const minTeamsResult = props.minTeams !== undefined ? IntegerNumber.safeCreate(props.minTeams) : success(this.MIN_TEAMS_REQUIRED)

    if (!minTeamsResult.success) {
      return this.failTeamsRange(props.minTeams!, props.maxTeams ?? props.minTeams!)
    }

    const minTeams = minTeamsResult.value

    const maxTeamsResult = props.maxTeams !== undefined ? IntegerNumber.safeCreate(props.maxTeams) : success(minTeams)

    if (!maxTeamsResult.success) {
      return this.failTeamsRange(minTeams.value, props.maxTeams!)
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

    if (minPlayers.isLessThan(IndividualParticipation.MIN_PLAYERS_REQUIRED) || minPlayers.isGreaterThan(realMinPlayersRequired)) {
      return this.failMinPlayers(minPlayers.value, realMinPlayersRequired.value)
    }

    return success(new TeamParticipation({ minTeams, maxTeams, playersPerTeam, minPlayers }))
  }

  private static failTeamsRange(min: number, max: number) {
    return fail(SportDomainException.invalidTeamsRange(this.MIN_TEAMS_REQUIRED.value, this.MAX_TEAMS_ALLOWED.value, min, max))
  }

  private static failMinPlayers(val: number, realMax: number) {
    return fail(SportDomainException.invalidTeamsMinPlayers(val, IndividualParticipation.MIN_PLAYERS_REQUIRED.value, realMax))
  }

  public equals(vo?: TeamParticipation | null): boolean {
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

  public toPrimitives(): TeamParticipationPrimitiveProps {
    const { maxTeams, minTeams, minPlayers, playersPerTeam } = this._value

    return {
      maxTeams: maxTeams.toPrimitives(),
      minTeams: minTeams.toPrimitives(),
      minPlayers: minPlayers.toPrimitives(),
      playersPerTeam: playersPerTeam.toPrimitives(),
    }
  }
}
