import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AltitudeDtoTranslator } from '~/src/modules/Shared/Application/Translator/AltitudeDtoTranslator'
import { AltitudeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { BaseScalarMagnitudeRangeTranslator } from '~/src/modules/Shared/Application/Translator/BaseScalarMagnitudeRangeTranslator'

export class AltitudeCapabilityQueryDtoTranslator extends BaseScalarMagnitudeRangeTranslator<AltitudeCapabilityPrimitives> {
  protected translateScalar(primitives: AltitudeCapabilityPrimitives['start']): MagnitudeDto {
    return new AltitudeDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: AltitudeCapabilityPrimitives['start'], end: AltitudeCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }
}
