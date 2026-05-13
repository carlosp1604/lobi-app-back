import { Result } from '~/src/modules/Shared/Domain/Result'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { BaseParticipantsSpecSchemaDto } from '~/src/modules/Activity/Application/Dto/Config/Spec/ParticipantsSpecSchemaDto'

export interface SpecPayloadValidationError {
  errors: Array<string>
}

export interface SpecPayloadContractInterface<PayloadType, SchemaContext = void> {
  validate(rawData: unknown): Result<PayloadType, SpecPayloadValidationError>
  getSchema(context: SchemaContext): BaseParticipantsSpecSchemaDto
}

export interface SpecPayloadContractClass<PayloadType, SchemaContext = void> {
  readonly specName: AvailableSpec
  new (): SpecPayloadContractInterface<PayloadType, SchemaContext>
}
