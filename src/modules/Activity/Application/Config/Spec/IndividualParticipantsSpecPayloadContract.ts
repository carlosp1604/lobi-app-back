import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SpecPayloadContractInterface } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractInterface'
import { CapabilityPayloadValidationError } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import { IndividualParticipantsSpecSchemaDto } from '~/src/modules/Activity/Application/Config/Spec/ParticipantsSpecSchemaDto'
import { IndividualParticipantsDefinitionReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'
import {
  IndividualParticipantsSpec,
  IndividualParticipantsSpecInputProps,
} from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'

export type IndividualParticipantsRawData = {
  minPlayers: number
  maxPlayers?: number
}

export class IndividualParticipantsSpecPayloadContract
  implements SpecPayloadContractInterface<IndividualParticipantsSpecInputProps, IndividualParticipantsDefinitionReadModel>
{
  public static readonly specName = 'individual_participants'

  public validate(rawData: unknown): Result<IndividualParticipantsSpecInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<IndividualParticipantsRawData>(rawData, {
      minPlayers: 'integer',
      maxPlayers: { type: 'integer', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const dataValue = typeCheck.value

    return success({
      minPlayers: dataValue.minPlayers,
      maxPlayers: dataValue.maxPlayers,
    })
  }

  public getSchema(context: IndividualParticipantsDefinitionReadModel): IndividualParticipantsSpecSchemaDto {
    return {
      allowedSpecs: ['individual_participants', 'team_participants'],
      defaultSpec: 'individual_participants',
      availableFields: ['minPlayers', 'maxPlayers'],
      optionalFields: [],
      defaultMinPlayers: context.defaultMinPlayers,
      defaultMaxPlayers: context.defaultMaxPlayers ?? IndividualParticipantsSpec.maxPlayers.value,
      players: {
        min: IndividualParticipantsSpec.minPlayers.value,
        max: IndividualParticipantsSpec.maxPlayers.value,
      },
    }
  }
}
