import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import { LocationRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { LocationApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationApplicationDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class LocationRangeApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<LocationRange, LocationRangeApplicationDto>
{
  public translate(domain: LocationRange): LocationRangeApplicationDto {
    return {
      type: 'range',
      start: new LocationApplicationDtoTranslator().translate(domain.start),
      end: new LocationApplicationDtoTranslator().translate(domain.end),
    }
  }
}
