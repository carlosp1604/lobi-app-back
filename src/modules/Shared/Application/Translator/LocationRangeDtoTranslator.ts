import { LocationRangeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'

export class LocationRangeQueryDtoTranslator implements DtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeDto> {
  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeDto {
    const { start, end } = primitives

    return {
      start: new LocationQueryDtoTranslator().translate(start),
      end: new LocationQueryDtoTranslator().translate(end),
    }
  }
}
