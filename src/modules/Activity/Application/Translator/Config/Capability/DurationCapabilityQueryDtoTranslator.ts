import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { DurationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationQueryDtoTranslator'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'
import { DurationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'

export class DurationCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<DurationCapabilityPrimitives> {
  protected translateScalar(primitives: DurationCapabilityPrimitives['start']): MagnitudeQueryDto {
    return new DurationQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: DurationCapabilityPrimitives['start'], end: DurationCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
