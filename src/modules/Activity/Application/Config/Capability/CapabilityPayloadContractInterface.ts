import { Result } from '~/src/modules/Shared/Domain/Result'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { BaseCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'

export interface CapabilityPayloadValidationError {
  errors: Array<string>
}

export interface CapabilityPayloadContractInterface<T, SchemaContext = void> {
  validate(rawData: unknown): Result<T, CapabilityPayloadValidationError>
  getSchema(context: SchemaContext): BaseCapabilitySchemaDto
}

export interface CapabilityPayloadContractClass<PayloadType, SchemaContext = void> {
  readonly capabilityName: AvailableCapability
  new (): CapabilityPayloadContractInterface<PayloadType, SchemaContext>
}
