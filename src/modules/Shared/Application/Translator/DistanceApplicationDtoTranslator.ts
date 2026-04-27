import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class DistanceApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Distance, MagnitudeApplicationDto> {
  public translate(domain: Distance): MagnitudeApplicationDto {
    const distanceInM = domain.convertTo('m')
    const distanceInKm = domain.convertTo('km')
    const distanceInMi = domain.convertTo('mi')

    const formattedMeters = `${distanceInM.round(2)} m`
    const formattedKm = `${distanceInKm.round(3)} km`
    const formattedMi = `${distanceInMi.round(3)} mi`

    return {
      type: 'scalar',
      value: distanceInM.numericValue,
      unit: Distance.DEFAULT_UNIT,
      conversions: {
        m: distanceInM.round(2),
        km: distanceInKm.round(3),
        mi: distanceInMi.round(3),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        km: { short: formattedKm, long: formattedKm },
        mi: { short: formattedMi, long: formattedMi },
      },
    }
  }
}
