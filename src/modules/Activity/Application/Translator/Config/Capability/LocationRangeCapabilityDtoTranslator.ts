import { LocationRangeDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationRangeDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import { LocationRangeCapabilityDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'

export class LocationRangeCapabilityDtoTranslator
  implements DtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeCapabilityDto>
{
  public static readonly capabilityName = 'location_range'

  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeCapabilityDto {
    return {
      type: 'geographic_range',
      name: LocationRangeCapabilityDtoTranslator.capabilityName,
      data: new LocationRangeDtoTranslator().translate(primitives),
    }
  }
}
