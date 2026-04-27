import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { Route } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Route'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import { RPECapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RPECapability'
import { PaceCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/PaceCapability'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { RouteCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RouteCapability'
import { SpeedCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/SpeedCapability'
import { RankingCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/RankingCapability'
import { AltitudeCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/AltitudeCapability'
import { DistanceCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/DistanceCapability'
import { DurationCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/DurationCapability'
import { LocationCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/LocationCapability'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Sport/Sport'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import { LocationRangeCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/LocationRangeCapability'
import { SportParticipantsDefinition } from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'
import { ParticipantsSpec, ParticipationStrategy } from '~/src/modules/Activity/Application/Sport/Specs/ParticipantsSpec'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/SportRankingSystem'
import { SportBaseCapability } from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'

export type ValidatedCapabilities = Partial<{
  altitude: MagnitudeRange<Altitude>
  distance: MagnitudeRange<Distance>
  duration: MagnitudeRange<Duration>
  location: Location
  location_range: LocationRange
  pace: MagnitudeRange<Pace>
  ranking: Array<SportRankingSystem>
  route: Route
  rpe: MagnitudeRange<RPE>
  speed: MagnitudeRange<Speed>
}>

export type ValidatedSpecs = Partial<{ participants: ParticipationStrategy }>

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

  public static getParticipantsSpec(definition: SportParticipantsDefinition): ParticipantsSpec {
    return new ParticipantsSpec(definition)
  }
}
