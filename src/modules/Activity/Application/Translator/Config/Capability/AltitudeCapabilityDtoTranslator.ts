import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { AltitudeDtoTranslator } from '~/src/modules/Shared/Application/Translator/AltitudeDtoTranslator'
import { AltitudeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class AltitudeCapabilityDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<AltitudeCapabilityPrimitives> {
  public static readonly capabilityName = 'altitude'

  protected translateScalar(primitives: AltitudeCapabilityPrimitives['start']): MagnitudeDto {
    return new AltitudeDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: AltitudeCapabilityPrimitives['start'], end: AltitudeCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return AltitudeCapabilityDtoTranslator.capabilityName
  }
}
