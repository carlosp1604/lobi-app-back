import { DecimalNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/DecimalNumber'
import { PaceConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/PaceConverter'
import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { PacePrimitives, PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Pace'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class PaceQueryDtoTranslator implements DtoTranslatorInterface<PacePrimitives, MagnitudeDto> {
  public translate(primitives: PacePrimitives): MagnitudeDto {
    const value = primitives.value
    const unit = primitives.unit as PaceUnit

    const paceInKm = PaceConverter.convert(value, unit, 'min/km')
    const paceInMi = PaceConverter.convert(value, unit, 'min/mi')

    return {
      type: 'scalar',
      value: paceInKm.toFixed(),
      unit: 'min/km',
      conversions: {
        'min/km': paceInKm.round(3).toFixed(),
        'min/mi': paceInMi.round(3).toFixed(),
      },
      formatted: {
        'min/km': {
          long: `${this.formatPaceFromSeconds(paceInKm, true)} min/km`,
          short: `${this.formatPaceFromSeconds(paceInKm)} min/km`,
        },
        'min/mi': {
          long: `${this.formatPaceFromSeconds(paceInMi, true)} min/mi`,
          short: `${this.formatPaceFromSeconds(paceInMi)} min/mi`,
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
