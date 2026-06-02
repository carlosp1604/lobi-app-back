import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { PaceDtoTranslator } from '~/src/modules/Shared/Application/Translator/PaceDtoTranslator'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { PaceCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class PaceCapabilityDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<PaceCapabilityPrimitives> {
  public static readonly capabilityName = 'pace'

  protected translateScalar(primitives: PaceCapabilityPrimitives['start']): MagnitudeDto {
    return new PaceDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: PaceCapabilityPrimitives['start'], end: PaceCapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return PaceCapabilityDtoTranslator.capabilityName
  }
}
