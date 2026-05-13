import { LocationRangeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { LocationRangeQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationRangeQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'

export class LocationRangeCapabilityQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeQueryDto>
{
  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeQueryDto {
    return new LocationRangeQueryDtoTranslator().translate(primitives)
  }
}
