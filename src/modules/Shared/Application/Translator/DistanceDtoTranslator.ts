import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { DistanceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/DistanceConverter'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { Distance, DistancePrimitives, DistanceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Distance'

export class DistanceDtoTranslator implements DtoTranslatorInterface<DistancePrimitives, MagnitudeDto> {
  public translate(primitives: DistancePrimitives): MagnitudeDto {
    const value = primitives.value
    const unit = primitives.unit as DistanceUnit

    const distanceInM = DistanceConverter.convert(value, unit, 'm')
    const distanceInKm = DistanceConverter.convert(value, unit, 'km')
    const distanceInMi = DistanceConverter.convert(value, unit, 'mi')

    const formattedMeters = `${distanceInM.round(2).toFixed()} m`
    const formattedKm = `${distanceInKm.round(3).toFixed()} km`
    const formattedMi = `${distanceInMi.round(3).toFixed()} mi`

    return {
      value: distanceInM.toFixed(),
      unit: Distance.DEFAULT_UNIT,
      conversions: {
        m: distanceInM.round(2).toFixed(),
        km: distanceInKm.round(3).toFixed(),
        mi: distanceInMi.round(3).toFixed(),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        km: { short: formattedKm, long: formattedKm },
        mi: { short: formattedMi, long: formattedMi },
      },
    }
  }
}
