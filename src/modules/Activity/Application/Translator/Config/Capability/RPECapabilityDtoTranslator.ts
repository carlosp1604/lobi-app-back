import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { RPEDtoTranslator } from '~/src/modules/Shared/Application/Translator/RPEDtoTranslator'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { RPECapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import { BaseMagnitudeRangeCapabilityDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Capability/BaseMagnitudeRangeCapabilityDtoTranslator'

export class RPECapabilityDtoTranslator extends BaseMagnitudeRangeCapabilityDtoTranslator<RPECapabilityPrimitives> {
  public static readonly capabilityName = 'rpe'

  protected translateScalar(primitives: RPECapabilityPrimitives['start']): MagnitudeDto {
    return new RPEDtoTranslator().translate(primitives)
  }

  protected isSingleValue(start: RPECapabilityPrimitives['start'], end: RPECapabilityPrimitives['end']): boolean {
    return start.normalizedValue === end.normalizedValue
  }

  protected getCapabilityName(): AvailableCapability {
    return RPECapabilityDtoTranslator.capabilityName
  }
}
