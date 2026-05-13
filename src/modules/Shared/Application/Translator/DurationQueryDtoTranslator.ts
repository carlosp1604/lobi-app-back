import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { Duration, DurationPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class DurationQueryDtoTranslator implements ApplicationDtoTranslatorInterface<DurationPrimitives, MagnitudeQueryDto> {
  public translate(primitives: DurationPrimitives): MagnitudeQueryDto {
    const totalSeconds = Number(primitives.value)
    const formatted = this.formatDuration(totalSeconds)

    return {
      type: 'scalar',
      value: primitives.value,
      unit: Duration.DEFAULT_UNIT,
      conversions: {
        s: primitives.value,
      },
      formatted: {
        s: { short: formatted, long: formatted },
      },
      format: totalSeconds >= 3600 ? 'HH:MM:SS' : 'MM:SS',
    }
  }

  private formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    const mm = m.toString().padStart(2, '0')
    const ss = s.toString().padStart(2, '0')
    const hh = h.toString().padStart(2, '0')

    return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
  }
}
