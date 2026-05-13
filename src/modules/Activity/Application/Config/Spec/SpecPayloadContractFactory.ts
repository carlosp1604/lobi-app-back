import { SpecPayloadContractInterface } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractInterface'
import {
  SpecPayloadContractRegistry,
  SpecPayloadContractTypeMap,
} from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractRegistry'

export class SpecPayloadContractFactory {
  public getContract<K extends keyof SpecPayloadContractTypeMap>(
    specName: K,
  ): SpecPayloadContractInterface<SpecPayloadContractTypeMap[K]['payloadType'], SpecPayloadContractTypeMap[K]['schemaContext']> {
    const ContractConstructor = SpecPayloadContractRegistry.getConstructor(specName)

    return new ContractConstructor()
  }
}
