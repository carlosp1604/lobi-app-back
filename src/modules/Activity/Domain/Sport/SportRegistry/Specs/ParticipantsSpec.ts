import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { TeamParticipation } from '~/src/modules/Activity/Domain/Sport/TeamParticipation'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { IndividualParticipation } from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import {
  SpecSchema,
  SportBaseSpec,
  SportSpecRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/SportBaseSpec'

export type ParticipantsSpecDefinition = {
  defaultMinPlayers: number
  teamsModule?: {
    defaultTeams: number
    defaultPlayersPerSide: number
  }
}

export type ParticipantsPayload = {
  minPlayersToPlay?: number
  maxPlayers?: number
  teams?: {
    minTeams?: number
    maxTeams?: number
    playersPerTeam?: number
  }
}

type ParticipationStrategy = IndividualParticipation | TeamParticipation

export class ParticipantsSpec extends SportBaseSpec<ParticipationStrategy, ParticipantsPayload> {
  public readonly specName = 'participants'

  constructor(private readonly definition: ParticipantsSpecDefinition) {
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
      return TeamParticipation.safeCreate({
        minTeams: payload.teams?.minTeams ?? teamsModule?.defaultTeams,
        maxTeams: payload.teams?.maxTeams ?? payload.teams?.minTeams ?? teamsModule?.defaultTeams,
        playersPerTeam: payload.teams?.playersPerTeam ?? teamsModule?.defaultPlayersPerSide ?? 1,
        minPlayers: payload.minPlayersToPlay,
      })
    }

    return IndividualParticipation.safeCreate({
      minPlayers: payload.minPlayersToPlay ?? this.definition.defaultMinPlayers,
      maxPlayers: payload.maxPlayers,
    })
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
                  playersPerSide: this.definition.teamsModule.defaultPlayersPerSide,
                }
              : {}),
          },
        },
      },
    }
  }

  public translate(data: ParticipationStrategy): unknown {
    const common = {
      kind: data.kind,
      minCapacity: data.minCapacity,
      maxCapacity: data.maxCapacity,
    }

    if (data instanceof IndividualParticipation) {
      return {
        ...common,
        config: {
          minPlayers: data.value.minPlayers,
          maxPlayers: data.value.maxPlayers,
        },
      }
    }

    return {
      ...common,
      config: {
        minTeams: data.value.minTeams,
        maxTeams: data.value.maxTeams,
        playersPerTeam: data.value.playersPerTeam,
        minToPlay: data.value.minPlayers,
      },
    }
  }
}
