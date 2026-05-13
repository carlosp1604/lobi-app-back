import { DistanceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/DistanceConverter'
import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { Distance, DistancePrimitives, DistanceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Distance'

export class DistanceQueryDtoTranslator implements ApplicationDtoTranslatorInterface<DistancePrimitives, MagnitudeQueryDto> {
  public translate(primitives: DistancePrimitives): MagnitudeQueryDto {
    const value = primitives.value
    const unit = primitives.unit as DistanceUnit

    const distanceInM = DistanceConverter.convert(value, unit, 'm')
    const distanceInKm = DistanceConverter.convert(value, unit, 'km')
    const distanceInMi = DistanceConverter.convert(value, unit, 'mi')

    const formattedMeters = `${distanceInM.round(2).toFixed()} m`
    const formattedKm = `${distanceInKm.round(3).toFixed()} km`
    const formattedMi = `${distanceInMi.round(3).toFixed()} mi`

    return {
      type: 'scalar',
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
