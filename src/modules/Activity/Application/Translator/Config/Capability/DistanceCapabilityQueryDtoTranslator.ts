import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { DistanceQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/DistanceQueryDtoTranslator'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'
import { DistanceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'

export class DistanceCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<DistanceCapabilityPrimitives> {
  protected translateScalar(primitives: DistanceCapabilityPrimitives['start']): MagnitudeQueryDto {
    return new DistanceQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: DistanceCapabilityPrimitives['start'], end: DistanceCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
