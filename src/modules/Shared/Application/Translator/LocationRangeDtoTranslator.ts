import { LocationRangeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { LocationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { LocationRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'

export class LocationRangeDtoTranslator implements DtoTranslatorInterface<LocationRangeCapabilityPrimitives, LocationRangeDto> {
  public translate(primitives: LocationRangeCapabilityPrimitives): LocationRangeDto {
    const { start, end } = primitives

    return {
      start: new LocationDtoTranslator().translate(start),
      end: new LocationDtoTranslator().translate(end),
    }
  }
}
