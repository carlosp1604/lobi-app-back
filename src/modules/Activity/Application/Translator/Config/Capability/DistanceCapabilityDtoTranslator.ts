import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { DistanceDtoTranslator } from '~/src/modules/Shared/Application/Translator/DistanceDtoTranslator'
import { DistanceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class DistanceCapabilityDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<DistanceCapabilityPrimitives> {
  public static readonly capabilityName = 'distance'

  protected translateScalar(primitives: DistanceCapabilityPrimitives['start']): MagnitudeDto {
    return new DistanceDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: DistanceCapabilityPrimitives['start'], end: DistanceCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return DistanceCapabilityDtoTranslator.capabilityName
  }
}
