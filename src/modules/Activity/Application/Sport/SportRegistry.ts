import { RPECapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RPECapability'
import { PaceCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/PaceCapability'
import { RouteCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RouteCapability'
import { SpeedCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/SpeedCapability'
import { ParticipantsSpec } from '~/src/modules/Activity/Application/Sport/Specs/ParticipantsSpec'
import { RankingCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RankingCapability'
import { AltitudeCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/AltitudeCapability'
import { DistanceCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/DistanceCapability'
import { DurationCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/DurationCapability'
import { LocationCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/LocationCapability'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Sport/Sport'
import { SportBaseCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import { LocationRangeCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/LocationRangeCapability'

const CAPABILITY_FACTORIES = {
  altitude: () => new AltitudeCapability(),
  distance: () => new DistanceCapability(),
  duration: () => new DurationCapability(),
  location: () => new LocationCapability(),
  location_range: () => new LocationRangeCapability(),
  pace: () => new PaceCapability(),
  ranking: () => new RankingCapability(BasicSportRankingSystem),
  route: () => new RouteCapability(),
  rpe: () => new RPECapability(),
  speed: () => new SpeedCapability(),
} as const

type CapabilityMap = typeof CAPABILITY_FACTORIES

export class SportRegistry {
  public static getCapability<K extends keyof CapabilityMap>(capability: K): ReturnType<CapabilityMap[K]>
  public static getCapability(capability: AvailableCapability): SportBaseCapability<unknown, unknown> | null {
    const factory = CAPABILITY_FACTORIES[capability]

    if (!factory) {
      return null
    }

    return factory()
  }

  public static getParticipantsSpec(): ParticipantsSpec {
    return new ParticipantsSpec()
  }
}
