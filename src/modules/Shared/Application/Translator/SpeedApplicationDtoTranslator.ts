import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class SpeedApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Speed, MagnitudeApplicationDto> {
  public translate(domain: Speed): MagnitudeApplicationDto {
    const speedInKmh = domain.convertTo('km/h')
    const speedInMph = domain.convertTo('mi/h')

    const formattedKmh = `${speedInKmh.round(2)} km/h`
    const formattedMph = `${speedInMph.round(2)} mi/h`

    return {
      type: 'scalar',
      value: speedInKmh.numericValue,
      unit: Speed.DEFAULT_UNIT,
      conversions: {
        'km/h': speedInKmh.round(2),
        'mi/h': speedInMph.round(2),
      },
      formatted: {
        'km/h': { short: formattedKmh, long: formattedKmh },
        'mi/h': { short: formattedMph, long: formattedMph },
      },
    }
  }
}
