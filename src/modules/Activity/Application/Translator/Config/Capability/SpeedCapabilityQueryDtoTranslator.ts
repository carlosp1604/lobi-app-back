import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { SpeedQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/SpeedQueryDtoTranslator'
import { SpeedCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'

export class SpeedCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<SpeedCapabilityPrimitives> {
  protected translateScalar(primitives: SpeedCapabilityPrimitives['start']): MagnitudeQueryDto {
    return new SpeedQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: SpeedCapabilityPrimitives['start'], end: SpeedCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
