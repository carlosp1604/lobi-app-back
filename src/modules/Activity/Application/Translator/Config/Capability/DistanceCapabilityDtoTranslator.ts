import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { DistanceDtoTranslator } from '~/src/modules/Shared/Application/Translator/DistanceDtoTranslator'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'
import { DistanceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'

export class DistanceCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<DistanceCapabilityPrimitives> {
  protected translateScalar(primitives: DistanceCapabilityPrimitives['start']): MagnitudeDto {
    return new DistanceDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: DistanceCapabilityPrimitives['start'], end: DistanceCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
