import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ParticipantsConfig, TeamsConfig } from '~/src/modules/Activity/Domain/Sport/ParticipantsConfig'
import {
  SportSpecInterface,
  SportSpecRawData,
  SportSpecType,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/SportSpecInterface'

export type ParticipantsSpecDefinition = {
  defaultMinPlayers: number
  maxPlayersLimit: number
  teamsModule?: {
    required: boolean
    defaultMinTeams: number
    defaultMaxTeams: number
    defaultPlayersPerTeam: number
  }
}

export type ParticipantsPayload = {
  minPlayersToPlay?: number
  teams?: {
    minTeams?: number
    maxTeams?: number
    playersPerTeam?: number
  }
}

export class ParticipantsSpec implements SportSpecInterface<ParticipantsConfig> {
  public readonly specName = 'participants'

  constructor(private readonly definition: ParticipantsSpecDefinition) {}

  public validate(rawValue: SportSpecRawData): Result<ParticipantsConfig, SportDomainException> {
    const typeCheck = TypeValidator.validate<ParticipantsPayload>(rawValue || {}, {
      minPlayersToPlay: { type: 'number', optional: true },
      teams: {
        type: 'object',
        optional: true,
        schema: {
          minTeams: { type: 'number', optional: true },
          maxTeams: { type: 'number', optional: true },
          playersPerTeam: { type: 'number', optional: true },
        },
      },
    })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidSpecData(this.specName, typeCheck.error))
    }

    const payload = typeCheck.value

    let finalTeams: TeamsConfig | undefined = undefined

    if (this.definition.teamsModule) {
      const hasUserTeams = payload.teams !== undefined

      if (this.definition.teamsModule.required || hasUserTeams) {
        finalTeams = {
          minTeams: payload.teams?.minTeams ?? this.definition.teamsModule.defaultMinTeams,
          maxTeams: payload.teams?.maxTeams ?? this.definition.teamsModule.defaultMaxTeams,
          playersPerTeam: payload.teams?.playersPerTeam ?? this.definition.teamsModule.defaultPlayersPerTeam,
        }
      }
    }

    const minPlayersToPlay = payload.minPlayersToPlay ?? this.definition.defaultMinPlayers

    const configResult = ParticipantsConfig.safeCreate({
      minPlayersToPlay,
      maxPlayers: this.definition.maxPlayersLimit,
      teams: finalTeams,
    })

    if (!configResult.success) {
      return fail(SportDomainException.specValidationFailed(this.specName, configResult.error.message))
    }

    return success(configResult.value)
  }

  public toDTO(): Record<string, unknown> {
    return {
      type: SportSpecType.PARTICIPANTS_CONFIG,
      defaults: {
        minPlayersToPlay: this.definition.defaultMinPlayers,
        maxPlayersLimit: this.definition.maxPlayersLimit,
        teams: this.definition.teamsModule
          ? {
              required: this.definition.teamsModule.required,
              minTeams: this.definition.teamsModule.defaultMinTeams,
              maxTeams: this.definition.teamsModule.defaultMaxTeams,
              playersPerTeam: this.definition.teamsModule.defaultPlayersPerTeam,
            }
          : null,
      },
    }
  }
}
