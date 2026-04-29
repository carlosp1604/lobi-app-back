import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { ParticipationStrategy } from '~/src/modules/Activity/Domain/Sport/ParticipationStrategy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SportParticipantsDefinition } from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'
import { TeamParticipationConfigurationApplication } from '~/src/modules/Activity/Application/Translator/TeamParticipationConfigurationApplicationDtoTranslator'
import { TeamParticipation, TeamParticipationPrimitiveProps } from '~/src/modules/Activity/Domain/Sport/TeamParticipation'
import { IndividualParticipationConfigurationApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/IndividualParticipationConfigurationApplicationDtoTranslator'
import {
  IndividualParticipation,
  IndividualParticipationPrimitiveProps,
} from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import {
  SpecSchema,
  SportBaseSpec,
  SportSpecRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Specs/SportBaseSpec'

export type ParticipantsRawData = {
  minPlayersToPlay?: number
  maxPlayers?: number
  teams?: {
    minTeams?: number
    maxTeams?: number
    playersPerTeam?: number
  }
}

export class ParticipantsSpec extends SportBaseSpec<ParticipationStrategy, ParticipantsRawData> {
  public readonly specName = 'participants'

  constructor() {
    super()
  }

  protected validateData(data: unknown): Result<ParticipantsRawData, SportSpecRawDataValidationError> {
    const typeCheck = TypeValidator.validate<ParticipantsRawData>(data || {}, {
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

  protected performValidation(
    payload: ParticipantsRawData,
    definition: SportParticipantsDefinition,
  ): Result<ParticipationStrategy, SportDomainException> {
    const { teamsModule } = definition

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
      minPlayers: payload.minPlayersToPlay ?? definition.defaultMinPlayers,
      maxPlayers: payload.maxPlayers,
    })

    if (!individualParticipationResult.success) {
      return fail(SportDomainException.specValidationFailed(this.specName, individualParticipationResult.error.message))
    }

    return success(individualParticipationResult.value)
  }

  public getSchema(definition: SportParticipantsDefinition): SpecSchema {
    return {
      name: this.specName,
      definition: {
        type: 'participants_config',
        isTeamSport: !!definition.teamsModule,
        defaults: {
          minPlayers: definition.defaultMinPlayers,
          teams: {
            required: definition.teamsModule,
            ...(definition.teamsModule
              ? {
                  minTeams: definition.teamsModule.defaultTeams,
                  playersPerSide: definition.teamsModule.defaultPlayersPerTeam,
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
