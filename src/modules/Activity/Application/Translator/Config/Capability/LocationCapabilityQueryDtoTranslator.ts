import { LocationQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { LocationCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class LocationCapabilityQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<LocationCapabilityPrimitives, LocationQueryDto>
{
  public translate(primitives: LocationCapabilityPrimitives): LocationQueryDto {
    return new LocationQueryDtoTranslator().translate(primitives)
  }
}
