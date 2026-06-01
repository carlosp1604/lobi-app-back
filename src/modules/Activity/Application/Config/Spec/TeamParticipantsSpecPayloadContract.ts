import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SpecPayloadContractInterface } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractInterface'
import { TeamParticipantsSpecSchemaDto } from '~/src/modules/Activity/Application/Dto/Config/Spec/ParticipantsSpecSchemaDto'
import { TeamParticipantsSpec, TeamParticipantsSpecInputProps } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { CapabilityPayloadValidationError } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import { TeamParticipantsDefinitionReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'

export type TeamParticipantsRawData = {
  minTeams: number
  maxTeams: number
  minPlayers?: number
  playersPerTeam: number
}

export class TeamParticipantsSpecPayloadContract
  implements SpecPayloadContractInterface<TeamParticipantsSpecInputProps, TeamParticipantsDefinitionReadModel>
{
  public static readonly specName = 'team_participants'

  public validate(rawData: unknown): Result<TeamParticipantsSpecInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<TeamParticipantsRawData>(rawData, {
      minTeams: 'integer',
      maxTeams: 'integer',
      minPlayers: { type: 'integer', optional: true },
      playersPerTeam: 'integer',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const dataValue = typeCheck.value

    console.log(dataValue)

    return success({
      minPlayers: dataValue.minPlayers,
      minTeams: dataValue.minTeams,
      maxTeams: dataValue.maxTeams,
      playersPerTeam: dataValue.playersPerTeam,
    })
  }

  public getSchema(context: TeamParticipantsDefinitionReadModel): TeamParticipantsSpecSchemaDto {
    return {
      allowedSpecs: ['team_participants'],
      defaultSpec: 'team_participants',
      availableFields: ['minTeams', 'maxTeams', 'minPlayers', 'playersPerTeam'],
      optionalFields: ['minPlayers'],
      defaultPlayers: context.defaultMinPlayers,
      defaultTeams: context.defaultTeams,
      defaultPlayersPerTeam: context.defaultPlayersPerTeam,
      teams: {
        min: TeamParticipantsSpec.minTeams.value,
        max: TeamParticipantsSpec.maxTeams.value,
      },
      playersPerTeam: {
        min: TeamParticipantsSpec.minPlayersPerTeam.value,
        max: TeamParticipantsSpec.maxPlayersPerTeam.value,
      },
    }
  }
}
