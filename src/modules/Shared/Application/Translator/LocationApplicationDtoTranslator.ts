import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { LocationApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class LocationApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Location, LocationApplicationDto> {
  public translate(domain: Location): LocationApplicationDto {
    return {
      type: 'geographic',
      lat: domain.value.lat.stringValue,
      lng: domain.value.lng.stringValue,
    }
  }
}
