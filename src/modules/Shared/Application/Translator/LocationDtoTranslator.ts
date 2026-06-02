import { LocationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { LocationPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class LocationQueryDtoTranslator implements DtoTranslatorInterface<LocationPrimitives, LocationDto> {
  public translate(primitives: LocationPrimitives): LocationDto {
    const { lat, lng } = primitives

    return {
      lat,
      lng,
    }
  }
}
