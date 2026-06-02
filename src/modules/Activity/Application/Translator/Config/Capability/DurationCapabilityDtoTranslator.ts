import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { DurationDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationDtoTranslator'
import { DurationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class DurationCapabilityDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<DurationCapabilityPrimitives> {
  public static readonly capabilityName = 'duration'

  protected translateScalar(primitives: DurationCapabilityPrimitives['start']): MagnitudeDto {
    return new DurationDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: DurationCapabilityPrimitives['start'], end: DurationCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return DurationCapabilityDtoTranslator.capabilityName
  }
}
