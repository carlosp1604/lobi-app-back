import { CapabilityPayloadContractInterface } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import {
  CapabilityPayloadContractRegistry,
  CapabilityPayloadContractTypeMap,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractRegistry'

export class CapabilityPayloadContractFactory {
  public getContract<K extends keyof CapabilityPayloadContractTypeMap>(
    capabilityName: K,
  ): CapabilityPayloadContractInterface<
    CapabilityPayloadContractTypeMap[K]['payloadType'],
    CapabilityPayloadContractTypeMap[K]['schemaContext']
  > {
    const ContractClass = CapabilityPayloadContractRegistry.getConstructor(capabilityName)

    return new ContractClass()
  }
}
