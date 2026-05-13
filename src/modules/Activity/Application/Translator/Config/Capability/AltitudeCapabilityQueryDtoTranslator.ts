import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { AltitudeQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/AltitudeQueryDtoTranslator'
import { AltitudeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'

export class AltitudeCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<AltitudeCapabilityPrimitives> {
  protected translateScalar(primitives: AltitudeCapabilityPrimitives['start']): MagnitudeQueryDto {
    return new AltitudeQueryDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: AltitudeCapabilityPrimitives['start'], end: AltitudeCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
