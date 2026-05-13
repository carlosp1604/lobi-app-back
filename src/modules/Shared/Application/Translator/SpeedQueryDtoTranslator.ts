import { SpeedConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/SpeedConverter'
import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { Speed, SpeedPrimitives, SpeedUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Speed'

export class SpeedQueryDtoTranslator implements ApplicationDtoTranslatorInterface<SpeedPrimitives, MagnitudeQueryDto> {
  public translate(primitives: SpeedPrimitives): MagnitudeQueryDto {
    const value = primitives.value
    const unit = primitives.unit as SpeedUnit

    const speedInKmh = SpeedConverter.convert(value, unit, 'km/h')
    const speedInMph = SpeedConverter.convert(value, unit, 'mi/h')

    const formattedKmh = `${speedInKmh.round(2).toFixed()} km/h`
    const formattedMph = `${speedInMph.round(2).toFixed()} mi/h`

    return {
      type: 'scalar',
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
