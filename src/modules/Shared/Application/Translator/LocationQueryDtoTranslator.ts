import { LocationQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { LocationPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class LocationQueryDtoTranslator implements ApplicationDtoTranslatorInterface<LocationPrimitives, LocationQueryDto> {
  public translate(primitives: LocationPrimitives): LocationQueryDto {
    const { lat, lng } = primitives

    return {
      type: 'geographic',
      lat,
      lng,
    }
  }
}
