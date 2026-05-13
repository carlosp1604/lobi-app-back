import { EnforceAvailableSpecKeys } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { SpecPayloadContractClass } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractInterface'
import { TeamParticipantsSpecInputProps } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { TeamParticipantsSpecPayloadContract } from '~/src/modules/Activity/Application/Config/Spec/TeamParticipantsSpecPayloadContract'
import { IndividualParticipantsSpecInputProps } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { IndividualParticipantsSpecPayloadContract } from '~/src/modules/Activity/Application/Config/Spec/IndividualParticipantsSpecPayloadContract'
import {
  IndividualParticipantsDefinitionReadModel,
  TeamParticipantsDefinitionReadModel,
} from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'

export type SpecPayloadContractTypes<PayloadType, SchemaContext> = {
  payloadType: PayloadType
  schemaContext: SchemaContext
}

export type SpecPayloadContractTypeMap = EnforceAvailableSpecKeys<{
  individual_participants: SpecPayloadContractTypes<IndividualParticipantsSpecInputProps, IndividualParticipantsDefinitionReadModel>
  team_participants: SpecPayloadContractTypes<TeamParticipantsSpecInputProps, TeamParticipantsDefinitionReadModel>
}>

export class SpecPayloadContractRegistry {
  private static readonly registry: {
    [K in keyof SpecPayloadContractTypeMap]: SpecPayloadContractClass<
      SpecPayloadContractTypeMap[K]['payloadType'],
      SpecPayloadContractTypeMap[K]['schemaContext']
    >
  } = {
    [IndividualParticipantsSpecPayloadContract.specName]: IndividualParticipantsSpecPayloadContract,
    [TeamParticipantsSpecPayloadContract.specName]: TeamParticipantsSpecPayloadContract,
  }

  public static getConstructor<K extends keyof SpecPayloadContractTypeMap>(name: K) {
    const constructor = this.registry[name]

    if (!constructor) {
      throw new Error(`Payload contract for spec "${name}" is not registered`)
    }

    return constructor
  }
}
