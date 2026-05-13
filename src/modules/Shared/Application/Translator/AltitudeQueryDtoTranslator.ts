import { AltitudeConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/AltitudeConverter'
import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { Altitude, AltitudePrimitives, AltitudeUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Altitude'

export class AltitudeQueryDtoTranslator implements ApplicationDtoTranslatorInterface<AltitudePrimitives, MagnitudeQueryDto> {
  public translate(primitives: AltitudePrimitives): MagnitudeQueryDto {
    const value = primitives.value
    const unit = primitives.unit as AltitudeUnit

    const altitudeInM = AltitudeConverter.convert(value, unit, 'm')
    const altitudeInFt = AltitudeConverter.convert(value, unit, 'ft')

    const formattedMeters = `${altitudeInM.round(2).toFixed()} m`
    const formattedFt = `${altitudeInFt.round(2).toFixed()} ft`

    return {
      type: 'scalar',
      value: altitudeInM.toFixed(),
      unit: Altitude.DEFAULT_UNIT,
      conversions: {
        m: altitudeInM.round(2).toFixed(),
        ft: altitudeInFt.round(2).toFixed(),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        ft: { short: formattedFt, long: formattedFt },
      },
    }
  }
}
