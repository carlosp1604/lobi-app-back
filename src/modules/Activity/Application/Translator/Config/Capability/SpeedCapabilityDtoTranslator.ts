import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { SpeedDtoTranslator } from '~/src/modules/Shared/Application/Translator/SpeedDtoTranslator'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { SpeedCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class SpeedCapabilityQueryDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<SpeedCapabilityPrimitives> {
  public static readonly capabilityName = 'speed'

  protected translateScalar(primitives: SpeedCapabilityPrimitives['start']): MagnitudeDto {
    return new SpeedDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: SpeedCapabilityPrimitives['start'], end: SpeedCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return SpeedCapabilityQueryDtoTranslator.capabilityName
  }
}
