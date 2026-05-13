import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { PaceQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/PaceQueryDtoTranslator'
import { PaceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'

export class PaceCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<PaceCapabilityPrimitives> {
  protected translateScalar(primitives: PaceCapabilityPrimitives['start']): MagnitudeQueryDto {
    return new PaceQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: PaceCapabilityPrimitives['start'], end: PaceCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
