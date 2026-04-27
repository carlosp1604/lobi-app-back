import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class PaceApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Pace, MagnitudeApplicationDto> {
  public translate(domain: Pace): MagnitudeApplicationDto {
    const paceInKm = domain.convertTo('min/km')
    const paceInMi = domain.convertTo('min/mi')

    return {
      type: 'scalar',
      value: paceInKm.numericValue,
      unit: 'min/km',
      conversions: {
        'min/km': paceInKm.round(3),
        'min/mi': paceInMi.round(3),
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

  private formatPaceFromSeconds(magnitude: BoundedNumber, withMillis: boolean = false): string {
    const totalSeconds = withMillis ? magnitude.round(3) : magnitude.round(0)
    const absoluteSeconds = Math.abs(totalSeconds)

    const minutes = Math.floor(absoluteSeconds / 60)
    const seconds = Math.floor(absoluteSeconds % 60)

    let formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    if (withMillis) {
      const fraction = (absoluteSeconds % 1).toFixed(3).split('.')[1] || '000'
      formatted += `.${fraction}`
    }

    return magnitude.numericValue < 0 ? `-${formatted}` : formatted
  }
}
