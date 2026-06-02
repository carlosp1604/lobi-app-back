import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { RPECapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import { PaceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import { SpeedCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'
import { RPECapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RPECapabilityDtoTranslator'
import { PaceCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/PaceCapabilityDtoTranslator'
import { RankingCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RankingCapability'
import { AltitudeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { DistanceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import { DurationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'
import { LocationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import { RouteCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RouteCapabilityDtoTranslator'
import { SpeedCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/SpeedCapabilityDtoTranslator'
import { RankingCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/RankingCapabilityDtoTranslator'
import { EnforceAvailableCapabilityKeys } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { AltitudeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/AltitudeCapabilityDtoTranslator'
import { DistanceCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/DistanceCapabilityDtoTranslator'
import { DurationCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/DurationCapabilityDtoTranslator'
import { LocationCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/LocationCapabilityDtoTranslator'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import { LocationRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/LocationRangeCapabilityDtoTranslator'
import {
  LocationCapabilityDto,
  LocationRangeCapabilityDto,
  MagnitudeRangeCapabilityDto,
  MultipleChoiceCapabilityDto,
  RouteCapabilityDto,
} from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'

export type CapabilityTranslatorTypes<DataType, DtoType> = {
  input: DataType
  output: DtoType
}

export type CapabilityTranslatorTypeMap = EnforceAvailableCapabilityKeys<{
  altitude: CapabilityTranslatorTypes<AltitudeCapabilityPrimitives, MagnitudeRangeCapabilityDto>
  distance: CapabilityTranslatorTypes<DistanceCapabilityPrimitives, MagnitudeRangeCapabilityDto>
  duration: CapabilityTranslatorTypes<DurationCapabilityPrimitives, MagnitudeRangeCapabilityDto>
  location: CapabilityTranslatorTypes<LocationCapabilityPrimitives, LocationCapabilityDto>
  location_range: CapabilityTranslatorTypes<LocationRangeCapabilityPrimitives, LocationRangeCapabilityDto>
  pace: CapabilityTranslatorTypes<PaceCapabilityPrimitives, MagnitudeRangeCapabilityDto>
  ranking: CapabilityTranslatorTypes<RankingCapabilityPrimitives, MultipleChoiceCapabilityDto>
  route: CapabilityTranslatorTypes<RoutePrimitives, RouteCapabilityDto>
  rpe: CapabilityTranslatorTypes<RPECapabilityPrimitives, MagnitudeRangeCapabilityDto>
  speed: CapabilityTranslatorTypes<SpeedCapabilityPrimitives, MagnitudeRangeCapabilityDto>
}>

export class CapabilityTranslatorRegistry {
  private static readonly registry: {
    [K in keyof CapabilityTranslatorTypeMap]: DtoTranslatorInterface<
      CapabilityTranslatorTypeMap[K]['input'],
      CapabilityTranslatorTypeMap[K]['output']
    >
  } = {
    [AltitudeCapabilityDtoTranslator.capabilityName]: new AltitudeCapabilityDtoTranslator(),
    [DistanceCapabilityDtoTranslator.capabilityName]: new DistanceCapabilityDtoTranslator(),
    [DurationCapabilityDtoTranslator.capabilityName]: new DurationCapabilityDtoTranslator(),
    [LocationCapabilityDtoTranslator.capabilityName]: new LocationCapabilityDtoTranslator(),
    [LocationRangeCapabilityDtoTranslator.capabilityName]: new LocationRangeCapabilityDtoTranslator(),
    [PaceCapabilityDtoTranslator.capabilityName]: new PaceCapabilityDtoTranslator(),
    [RankingCapabilityDtoTranslator.capabilityName]: new RankingCapabilityDtoTranslator(),
    [RouteCapabilityDtoTranslator.capabilityName]: new RouteCapabilityDtoTranslator(),
    [RPECapabilityDtoTranslator.capabilityName]: new RPECapabilityDtoTranslator(),
    [SpeedCapabilityDtoTranslator.capabilityName]: new SpeedCapabilityDtoTranslator(),
  }

  public static getTranslator<K extends keyof CapabilityTranslatorTypeMap>(capability: K) {
    const translator = this.registry[capability]

    if (!translator) {
      throw Error(`Capability DTO translator for '${capability}' is not registered`)
    }

    return translator
  }
}
