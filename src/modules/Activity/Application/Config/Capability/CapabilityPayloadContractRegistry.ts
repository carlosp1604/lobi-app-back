import { SportLevelDto } from '~/src/modules/Activity/Application/Dto/Sport/SportLevelDto'
import { RPECapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import { PaceCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import { RouteCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/RouteCapability'
import { SpeedCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'
import { RankingCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import { AltitudeCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { DistanceCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import { DurationCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'
import { LocationCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import { RPECapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/RPECapabilityPayloadContract'
import { PaceCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/PaceCapabilityPayloadContract'
import { CapabilityPayloadContractClass } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import { EnforceAvailableCapabilityKeys } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { RouteCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/RouteCapabilityPayloadContract'
import { SpeedCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/SpeedCapabilityPayloadContract'
import { RankingCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/RankingCapabilityPayloadContract'
import { LocationRangeCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import { AltitudeCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/AltitudeCapabilityPayloadContract'
import { DistanceCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/DistanceCapabilityPayloadContract'
import { DurationCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/DurationCapabilityPayloadContract'
import { LocationCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/LocationCapabilityPayloadContract'
import { LocationRangeCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/LocationRangeCapabilityPayloadContract'

export type CapabilityPayloadContractTypes<PayloadType, SchemaContext = void> = {
  payloadType: PayloadType
  schemaContext: SchemaContext
}

export type CapabilityPayloadContractTypeMap = EnforceAvailableCapabilityKeys<{
  altitude: CapabilityPayloadContractTypes<AltitudeCapabilityInputProps>
  distance: CapabilityPayloadContractTypes<DistanceCapabilityInputProps>
  duration: CapabilityPayloadContractTypes<DurationCapabilityInputProps>
  location: CapabilityPayloadContractTypes<LocationCapabilityInputProps>
  location_range: CapabilityPayloadContractTypes<LocationRangeCapabilityInputProps>
  pace: CapabilityPayloadContractTypes<PaceCapabilityInputProps>
  ranking: CapabilityPayloadContractTypes<RankingCapabilityInputProps, Array<SportLevelDto>>
  route: CapabilityPayloadContractTypes<RouteCapabilityInputProps>
  rpe: CapabilityPayloadContractTypes<RPECapabilityInputProps>
  speed: CapabilityPayloadContractTypes<SpeedCapabilityInputProps>
}>

export class CapabilityPayloadContractRegistry {
  private static readonly registry: {
    [K in keyof CapabilityPayloadContractTypeMap]: CapabilityPayloadContractClass<
      CapabilityPayloadContractTypeMap[K]['payloadType'],
      CapabilityPayloadContractTypeMap[K]['schemaContext']
    >
  } = {
    [AltitudeCapabilityPayloadContract.capabilityName]: AltitudeCapabilityPayloadContract,
    [DistanceCapabilityPayloadContract.capabilityName]: DistanceCapabilityPayloadContract,
    [DurationCapabilityPayloadContract.capabilityName]: DurationCapabilityPayloadContract,
    [LocationCapabilityPayloadContract.capabilityName]: LocationCapabilityPayloadContract,
    [LocationRangeCapabilityPayloadContract.capabilityName]: LocationRangeCapabilityPayloadContract,
    [PaceCapabilityPayloadContract.capabilityName]: PaceCapabilityPayloadContract,
    [RankingCapabilityPayloadContract.capabilityName]: RankingCapabilityPayloadContract,
    [RouteCapabilityPayloadContract.capabilityName]: RouteCapabilityPayloadContract,
    [RPECapabilityPayloadContract.capabilityName]: RPECapabilityPayloadContract,
    [SpeedCapabilityPayloadContract.capabilityName]: SpeedCapabilityPayloadContract,
  }

  public static getConstructor<K extends keyof CapabilityPayloadContractTypeMap>(name: K) {
    const constructor = this.registry[name]

    if (!constructor) {
      throw new Error(`Payload contract for capability "${name}" is not registered`)
    }

    return constructor
  }
}
