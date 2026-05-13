import { RouteQueryDto } from '~/src/modules/Shared/Application/DTO/RouteQueryDto'
import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { RPECapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import { PaceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import { RankingCapabilityQueryDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/RankingCapabilityQueryDto'
import { SpeedCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'
import { RankingCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import { AltitudeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { DistanceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import { DurationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'
import { LocationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import { EnforceAvailableCapabilityKeys } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { RPECapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RPECapabilityQueryDtoTranslator'
import { PaceCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/PaceCapabilityQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import { RouteCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RouteCapabilityQueryDtoTranslator'
import { SpeedCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/SpeedCapabilityQueryDtoTranslator'
import { RankingCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RankingCapabilityQueryDtoTranslator'
import { AltitudeCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/AltitudeCapabilityQueryDtoTranslator'
import { DistanceCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/DistanceCapabilityQueryDtoTranslator'
import { DurationCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/DurationCapabilityQueryDtoTranslator'
import { LocationCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/LocationCapabilityQueryDtoTranslator'
import { LocationRangeCapabilityQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/LocationRangeCapabilityQueryDtoTranslator'
import { LocationQueryDto, LocationRangeQueryDto, MagnitudeRangeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'

export type CapabilityTranslatorTypes<DataType, DtoType> = {
  input: DataType
  output: DtoType
}

export type CapabilityTranslatorTypeMap = EnforceAvailableCapabilityKeys<{
  altitude: CapabilityTranslatorTypes<AltitudeCapabilityPrimitives, MagnitudeRangeQueryDto>
  distance: CapabilityTranslatorTypes<DistanceCapabilityPrimitives, MagnitudeRangeQueryDto>
  duration: CapabilityTranslatorTypes<DurationCapabilityPrimitives, MagnitudeRangeQueryDto>
  location: CapabilityTranslatorTypes<LocationCapabilityPrimitives, LocationQueryDto>
  location_range: CapabilityTranslatorTypes<LocationRangeCapabilityPrimitives, LocationRangeQueryDto>
  pace: CapabilityTranslatorTypes<PaceCapabilityPrimitives, MagnitudeRangeQueryDto>
  ranking: CapabilityTranslatorTypes<RankingCapabilityPrimitives, RankingCapabilityQueryDto>
  route: CapabilityTranslatorTypes<RoutePrimitives, RouteQueryDto | null>
  rpe: CapabilityTranslatorTypes<RPECapabilityPrimitives, MagnitudeRangeQueryDto>
  speed: CapabilityTranslatorTypes<SpeedCapabilityPrimitives, MagnitudeRangeQueryDto>
}>

export class CapabilityTranslatorRegistry {
  private static readonly registry: {
    [K in keyof CapabilityTranslatorTypeMap]: ApplicationDtoTranslatorInterface<
      CapabilityTranslatorTypeMap[K]['input'],
      CapabilityTranslatorTypeMap[K]['output']
    >
  } = {
    altitude: new AltitudeCapabilityQueryDtoTranslator(),
    distance: new DistanceCapabilityQueryDtoTranslator(),
    duration: new DurationCapabilityQueryDtoTranslator(),
    location: new LocationCapabilityQueryDtoTranslator(),
    location_range: new LocationRangeCapabilityQueryDtoTranslator(),
    pace: new PaceCapabilityQueryDtoTranslator(),
    ranking: new RankingCapabilityQueryDtoTranslator(),
    route: new RouteCapabilityQueryDtoTranslator(),
    rpe: new RPECapabilityQueryDtoTranslator(),
    speed: new SpeedCapabilityQueryDtoTranslator(),
  }

  public static getTranslator<K extends keyof CapabilityTranslatorTypeMap>(capability: K) {
    const translator = this.registry[capability]

    if (!translator) {
      throw Error(`Capability DTO translator for '${capability}' is not registered`)
    }

    return translator
  }
}
