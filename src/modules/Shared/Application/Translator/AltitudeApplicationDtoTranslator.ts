import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class AltitudeApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Altitude, MagnitudeApplicationDto> {
  public translate(domain: Altitude): MagnitudeApplicationDto {
    const altitudeInM = domain.convertTo('m')
    const altitudeInFt = domain.convertTo('ft')

    const formattedMeters = `${altitudeInM.round(2)} m`
    const formattedFt = `${altitudeInFt.round(2)} ft`

    return {
      type: 'scalar',
      value: altitudeInM.numericValue,
      unit: Altitude.DEFAULT_UNIT,
      conversions: {
        m: altitudeInM.round(2),
        ft: altitudeInFt.round(2),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        ft: { short: formattedFt, long: formattedFt },
      },
    }
  }
}
