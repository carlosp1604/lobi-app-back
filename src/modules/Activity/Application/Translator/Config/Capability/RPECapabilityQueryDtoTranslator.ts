import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { RPEQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/RPEQueryDtoTranslator'
import { RPECapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'

export class RPECapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<RPECapabilityPrimitives> {
  protected translateScalar(primitives: RPECapabilityPrimitives['start']): MagnitudeQueryDto {
    return new RPEQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: RPECapabilityPrimitives['start'], end: RPECapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
