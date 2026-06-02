import { LocationRangeDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationRangeDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import { LocationRangeCapabilityDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilityDto'

export class LocationRangeCapabilityQueryDtoTranslator
  implements DtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeCapabilityDto>
{
  public static readonly capabilityName = 'location_range'

  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeCapabilityDto {
    return {
      type: 'geographic_range',
      name: LocationRangeCapabilityQueryDtoTranslator.capabilityName,
      data: new LocationRangeDtoTranslator().translate(primitives),
    }
  }
}
