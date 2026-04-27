import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SportParticipantsDefinition } from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'
import { TeamParticipation, TeamParticipationPrimitiveProps } from '~/src/modules/Activity/Domain/Sport/TeamParticipation'
import {
  IndividualParticipation,
  IndividualParticipationPrimitiveProps,
} from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import {
  SpecSchema,
  SportBaseSpec,
  SportSpecRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Specs/SportBaseSpec'
import { IndividualParticipationConfigurationApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/IndividualParticipationConfigurationApplicationDtoTranslator'
import { TeamParticipationConfigurationApplication } from '~/src/modules/Activity/Application/Translator/TeamParticipationConfigurationApplicationDtoTranslator'

export type ParticipantsPayload = {
  minPlayersToPlay?: number
  maxPlayers?: number
  teams?: {
    minTeams?: number
    maxTeams?: number
    playersPerTeam?: number
  }
}

export type ParticipationStrategy = IndividualParticipation | TeamParticipation

export class ParticipantsSpec extends SportBaseSpec<ParticipationStrategy, ParticipantsPayload> {
  public readonly specName = 'participants'

  constructor(private readonly definition: SportParticipantsDefinition) {
    super()
  }

  protected validateData(data: unknown): Result<ParticipantsPayload, SportSpecRawDataValidationError> {
    const typeCheck = TypeValidator.validate<ParticipantsPayload>(data || {}, {
      minPlayersToPlay: { type: 'integer', optional: true },
      maxPlayers: { type: 'integer', optional: true },
      teams: {
        type: 'object',
        optional: true,
        schema: {
          minTeams: { type: 'integer', optional: true },
          maxTeams: { type: 'integer', optional: true },
          playersPerTeam: { type: 'integer', optional: true },
        },
      },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(payload: ParticipantsPayload): Result<ParticipationStrategy, SportDomainException> {
    const { teamsModule } = this.definition

    if (payload.teams || teamsModule) {
      const teamParticipationResult = TeamParticipation.safeCreate({
        minTeams: payload.teams?.minTeams ?? teamsModule?.defaultTeams ?? SportParticipantsDefinition.MIN_TEAMS,
        maxTeams:
          payload.teams?.maxTeams ?? payload.teams?.minTeams ?? teamsModule?.defaultTeams ?? SportParticipantsDefinition.MIN_TEAMS,
        playersPerTeam:
          payload.teams?.playersPerTeam ?? teamsModule?.defaultPlayersPerTeam ?? SportParticipantsDefinition.MIN_PLAYERS_PER_TEAM,
        minPlayers: payload.minPlayersToPlay,
      })

      if (!teamParticipationResult.success) {
        return fail(SportDomainException.specValidationFailed(this.specName, teamParticipationResult.error.message))
      }

      return success(teamParticipationResult.value)
    }

    const individualParticipationResult = IndividualParticipation.safeCreate({
      minPlayers: payload.minPlayersToPlay ?? this.definition.defaultMinPlayers,
      maxPlayers: payload.maxPlayers,
    })

    if (!individualParticipationResult.success) {
      return fail(SportDomainException.specValidationFailed(this.specName, individualParticipationResult.error.message))
    }

    return success(individualParticipationResult.value)
  }

  public getSchema(): SpecSchema {
    return {
      name: this.specName,
      definition: {
        type: 'participants_config',
        isTeamSport: !!this.definition.teamsModule,
        defaults: {
          minPlayers: this.definition.defaultMinPlayers,
          teams: {
            required: this.definition.teamsModule,
            ...(this.definition.teamsModule
              ? {
                  minTeams: this.definition.teamsModule.defaultTeams,
                  playersPerSide: this.definition.teamsModule.defaultPlayersPerTeam,
                }
              : {}),
          },
        },
      },
    }
  }

  public toPrimitives(data: ParticipationStrategy): IndividualParticipationPrimitiveProps | TeamParticipationPrimitiveProps {
    return data.toPrimitives()
  }

  public translate(data: ParticipationStrategy): unknown {
    if (data instanceof IndividualParticipation) {
      return new IndividualParticipationConfigurationApplicationDtoTranslator().translate(data)
    }

    return new TeamParticipationConfigurationApplication().translate(data)
  }
}
