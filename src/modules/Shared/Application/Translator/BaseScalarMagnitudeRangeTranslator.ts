import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { MagnitudeRangePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'
import { MagnitudeDto, MagnitudeRangeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'

export abstract class BaseScalarMagnitudeRangeTranslator<T extends MagnitudeRangePrimitives<unknown>>
  implements DtoTranslatorInterface<T, MagnitudeRangeDto>
{
  public translate(primitives: T): MagnitudeRangeDto {
    const { start, end, average } = primitives

    const translatedStart = this.translateScalar(start)
    const translatedEnd = this.translateScalar(end)

    const translatedAvg = average ? this.translateScalar(average) : undefined

    const isSingleValue = this.isSingleValue(start, end)

    return {
      start: translatedStart,
      end: translatedEnd,
      average: translatedAvg,
      isSingleValue,
      unit: translatedStart.unit,
    }
  }

  protected abstract translateScalar(raw: T['start']): MagnitudeDto
  protected abstract isSingleValue(start: T['start'], end: T['end']): boolean
}
