import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AltitudeConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/AltitudeConverter'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { Altitude, AltitudePrimitives, AltitudeUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Altitude'

export class AltitudeDtoTranslator implements DtoTranslatorInterface<AltitudePrimitives, MagnitudeDto> {
  public translate(primitives: AltitudePrimitives): MagnitudeDto {
    const value = primitives.value
    const unit = primitives.unit as AltitudeUnit

    const altitudeInM = AltitudeConverter.convert(value, unit, 'm')
    const altitudeInFt = AltitudeConverter.convert(value, unit, 'ft')

    const formattedMeters = `${altitudeInM.round(2).toFixed()} m`
    const formattedFt = `${altitudeInFt.round(2).toFixed()} ft`

    return {
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
