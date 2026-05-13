import { CapabilityClass } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { EnforceAvailableCapabilityKeys } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import {
  AltitudeCapability,
  AltitudeCapabilityInputProps,
  AltitudeCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import {
  DistanceCapability,
  DistanceCapabilityInputProps,
  DistanceCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import {
  DurationCapability,
  DurationCapabilityInputProps,
  DurationCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'
import {
  LocationCapability,
  LocationCapabilityInputProps,
  LocationCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import {
  LocationRangeCapability,
  LocationRangeCapabilityInputProps,
  LocationRangeCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import {
  PaceCapability,
  PaceCapabilityInputProps,
  PaceCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import {
  RankingCapability,
  RankingCapabilityInputProps,
  RankingCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import {
  RouteCapability,
  RouteCapabilityInputProps,
  RouteCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/RouteCapability'
import {
  RPECapability,
  RPECapabilityInputProps,
  RPECapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import {
  SpeedCapability,
  SpeedCapabilityInputProps,
  SpeedCapabilityPrimitives,
} from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'

export type CapabilityTypes<Instance, Input, Primitives> = {
  instance: Instance
  input: Input
  primitives: Primitives
}

export type CapabilityTypeMap = EnforceAvailableCapabilityKeys<{
  altitude: CapabilityTypes<AltitudeCapability, AltitudeCapabilityInputProps, AltitudeCapabilityPrimitives>
  distance: CapabilityTypes<DistanceCapability, DistanceCapabilityInputProps, DistanceCapabilityPrimitives>
  duration: CapabilityTypes<DurationCapability, DurationCapabilityInputProps, DurationCapabilityPrimitives>
  location: CapabilityTypes<LocationCapability, LocationCapabilityInputProps, LocationCapabilityPrimitives>
  location_range: CapabilityTypes<LocationRangeCapability, LocationRangeCapabilityInputProps, LocationRangeCapabilityPrimitives>
  pace: CapabilityTypes<PaceCapability, PaceCapabilityInputProps, PaceCapabilityPrimitives>
  ranking: CapabilityTypes<RankingCapability, RankingCapabilityInputProps, RankingCapabilityPrimitives>
  route: CapabilityTypes<RouteCapability, RouteCapabilityInputProps, RouteCapabilityPrimitives>
  rpe: CapabilityTypes<RPECapability, RPECapabilityInputProps, RPECapabilityPrimitives>
  speed: CapabilityTypes<SpeedCapability, SpeedCapabilityInputProps, SpeedCapabilityPrimitives>
}>

export class CapabilityRegistry {
  private static readonly registry: {
    [K in keyof CapabilityTypeMap]: CapabilityClass<
      CapabilityTypeMap[K]['instance'],
      CapabilityTypeMap[K]['input'],
      CapabilityTypeMap[K]['primitives']
    >
  } = {
    [AltitudeCapability.capabilityName]: AltitudeCapability,
    [DistanceCapability.capabilityName]: DistanceCapability,
    [DurationCapability.capabilityName]: DurationCapability,
    [LocationCapability.capabilityName]: LocationCapability,
    [LocationRangeCapability.capabilityName]: LocationRangeCapability,
    [PaceCapability.capabilityName]: PaceCapability,
    [RankingCapability.capabilityName]: RankingCapability,
    [RouteCapability.capabilityName]: RouteCapability,
    [RPECapability.capabilityName]: RPECapability,
    [SpeedCapability.capabilityName]: SpeedCapability,
  }

  public static getConstructor<K extends keyof CapabilityTypeMap>(name: K) {
    const constructor = this.registry[name]

    if (!constructor) {
      throw new Error(`Capability "${name}" is not registered`)
    }

    return constructor
  }

  public static areEqual<K extends keyof CapabilityTypeMap>(
    capability: CapabilityTypeMap[K]['instance'],
    otherCapability: CapabilityTypeMap[K]['instance'],
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return capability.equals(otherCapability as any)
  }
}
