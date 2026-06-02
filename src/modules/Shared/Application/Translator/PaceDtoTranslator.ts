import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { DecimalNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'
import { PaceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/PaceConverter'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { PacePrimitives, PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Pace'

export class PaceDtoTranslator implements DtoTranslatorInterface<PacePrimitives, MagnitudeDto> {
  public translate(primitives: PacePrimitives): MagnitudeDto {
    const value = primitives.value
    const unit = primitives.unit as PaceUnit

    const paceInMinKm = PaceConverter.convert(value, unit, 'min/km')
    const paceInMinMi = PaceConverter.convert(value, unit, 'min/mi')

    return {
      value: paceInMinKm.toFixed(),
      unit: 'min/km',
      conversions: {
        'min/km': paceInMinKm.round(3).toFixed(),
        'min/mi': paceInMinMi.round(3).toFixed(),
      },
      formatted: {
        'min/km': {
          long: `${this.formatPaceFromSeconds(paceInMinKm, true)} min/km`,
          short: `${this.formatPaceFromSeconds(paceInMinKm)} min/km`,
        },
        'min/mi': {
          long: `${this.formatPaceFromSeconds(paceInMinKm, true)} min/mi`,
          short: `${this.formatPaceFromSeconds(paceInMinKm)} min/mi`,
        },
      },
    }
  }

  private formatPaceFromSeconds(magnitude: DecimalNumber, withMillis: boolean = false): string {
    const absolute = magnitude.absolute()

    const sixty = DecimalNumber.create('60')
    const minutes = absolute.divide(sixty).floor(0)

    const totalSeconds = absolute.subtract(minutes.multiply(sixty))

    const seconds = totalSeconds.floor(0)

    const mm = minutes.toFixed(0).padStart(2, '0')
    const ss = seconds.toFixed(0).padStart(2, '0')
    let formatted = `${mm}:${ss}`

    if (withMillis) {
      const millis = totalSeconds.getFractionalPart(3)
      formatted += `.${millis}`
    }

    return formatted
  }
}
