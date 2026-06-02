import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { SpeedConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/SpeedConverter'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { Speed, SpeedPrimitives, SpeedUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Speed'

export class SpeedDtoTranslator implements DtoTranslatorInterface<SpeedPrimitives, MagnitudeDto> {
  public translate(primitives: SpeedPrimitives): MagnitudeDto {
    const value = primitives.value
    const unit = primitives.unit as SpeedUnit

    const speedInKmh = SpeedConverter.convert(value, unit, 'km/h')
    const speedInMph = SpeedConverter.convert(value, unit, 'mi/h')

    const formattedKmh = `${speedInKmh.round(2).toFixed()} km/h`
    const formattedMph = `${speedInMph.round(2).toFixed()} mi/h`

    return {
      value: speedInKmh.toFixed(),
      unit: Speed.DEFAULT_UNIT,
      conversions: {
        'km/h': speedInKmh.round(2).toFixed(),
        'mi/h': speedInMph.round(2).toFixed(),
      },
      formatted: {
        'km/h': { short: formattedKmh, long: formattedKmh },
        'mi/h': { short: formattedMph, long: formattedMph },
      },
    }
  }
}
