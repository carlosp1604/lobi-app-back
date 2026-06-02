import { LocationCapabilityDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'
import { LocationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { LocationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'

export class LocationCapabilityDtoTranslator implements DtoTranslatorInterface<LocationCapabilityPrimitives, LocationCapabilityDto> {
  public static readonly capabilityName = 'location'

  public translate(primitives: LocationCapabilityPrimitives): LocationCapabilityDto {
    return {
      type: 'geographic_point',
      name: LocationCapabilityDtoTranslator.capabilityName,
      data: new LocationDtoTranslator().translate(primitives),
    }
  }
}
