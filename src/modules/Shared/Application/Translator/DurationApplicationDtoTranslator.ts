import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class DurationApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Duration, MagnitudeApplicationDto> {
  public translate(domain: Duration): MagnitudeApplicationDto {
    const formattedSeconds = this.formatDurationFromSeconds(domain.value)

    return {
      type: 'scalar',
      value: domain.value.value,
      unit: 's',
      formatted: {
        s: { short: formattedSeconds, long: formattedSeconds },
      },
      format: ['HH:MM:SS', 'MM:SS'],
    }
  }

  private formatDurationFromSeconds(totalSeconds: IntegerNumber): string {
    const numericValue = totalSeconds.value
    const hours = Math.floor(numericValue / 3600)
    const minutes = Math.floor((numericValue % 3600) / 60)
    const seconds = numericValue % 60

    const m = minutes.toString().padStart(2, '0')
    const s = seconds.toString().padStart(2, '0')

    return hours > 0 ? `${hours.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`
  }
}
