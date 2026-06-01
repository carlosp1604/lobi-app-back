import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SpecInterface } from '~/src/modules/Activity/Domain/Config/Spec/SpecInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  TeamParticipantsConfig,
  TeamParticipantsConfigInputProps,
  TeamParticipantsConfigPrimitives,
} from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsConfig'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export type TeamParticipantsSpecInputProps = TeamParticipantsConfigInputProps
export type TeamParticipantsSpecPrimitives = TeamParticipantsConfigPrimitives

export class TeamParticipantsSpec extends ValueObject<TeamParticipantsConfig> implements SpecInterface<TeamParticipantsSpecPrimitives> {
  public static readonly specName = 'team_participants'
  public static readonly maxPlayersPerTeam = TeamParticipantsConfig.MAX_PLAYERS_PER_TEAM_ALLOWED
  public static readonly minPlayersPerTeam = TeamParticipantsConfig.MIN_PLAYERS_PER_TEAM_REQUIRED
  public static readonly maxTeams = TeamParticipantsConfig.MAX_TEAMS_ALLOWED
  public static readonly minTeams = TeamParticipantsConfig.MIN_TEAMS_REQUIRED

  private constructor(teamParticipation: TeamParticipantsConfig) {
    super(teamParticipation)
  }

  public static safeCreate(props: TeamParticipantsSpecInputProps): Result<TeamParticipantsSpec, ActivityDomainException> {
    const teamParticipationResult = TeamParticipantsConfig.safeCreate(props)

    if (!teamParticipationResult.success) {
      return fail(ActivityDomainException.invalidSpecConfiguration(this.specName, teamParticipationResult.error.message))
    }

    return success(new TeamParticipantsSpec(teamParticipationResult.value))
  }

  public static create(props: TeamParticipantsSpecInputProps): TeamParticipantsSpec {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: TeamParticipantsSpecPrimitives): TeamParticipantsSpec {
    return new TeamParticipantsSpec(TeamParticipantsConfig.fromPrimitives(primitives))
  }

  public toPrimitives(): TeamParticipantsSpecPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: TeamParticipantsSpec | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(vo._value)
  }
}
