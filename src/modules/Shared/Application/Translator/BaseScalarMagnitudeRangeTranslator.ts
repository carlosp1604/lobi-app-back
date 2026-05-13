import { MagnitudeRangePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { MagnitudeQueryDto, MagnitudeRangeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'

export abstract class BaseScalarMagnitudeRangeTranslator<T extends MagnitudeRangePrimitives<unknown>>
  implements ApplicationDtoTranslatorInterface<T, MagnitudeRangeQueryDto>
{
  public translate(primitives: T): MagnitudeRangeQueryDto {
    const { start, end, average } = primitives

    const translatedStart = this.translateScalar(start)
    const translatedEnd = this.translateScalar(end)

    const translatedAvg = average ? this.translateScalar(average) : undefined

    const isSingleValue = this.isSingleValue(start, end)

    return {
      type: 'range',
      start: translatedStart,
      end: translatedEnd,
      average: translatedAvg,
      isSingleValue,
      unit: translatedStart.unit,
    }
  }

  protected abstract translateScalar(raw: T['start']): MagnitudeQueryDto
  protected abstract isSingleValue(start: T['start'], end: T['end']): boolean
}
