import { LocationRangeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'

export class LocationRangeQueryDtoTranslator
  implements ApplicationDtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeQueryDto>
{
  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeQueryDto {
    const { start, end } = primitives

    return {
      type: 'range',
      start: new LocationQueryDtoTranslator().translate(start),
      end: new LocationQueryDtoTranslator().translate(end),
    }
  }
}
