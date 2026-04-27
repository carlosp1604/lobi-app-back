import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { MagnitudeToPresentationVisitor } from '~/src/modules/Shared/Domain/Visitor/MagnitudeToPresentationVisitor'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { MagnitudeApplicationDto, MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'

export class MagnitudeRangeApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<MagnitudeRange<Rangeable<unknown>>, MagnitudeRangeApplicationDto>
{
  public translate(domain: MagnitudeRange<Rangeable<unknown>>): MagnitudeRangeApplicationDto {
    const visitor = new MagnitudeToPresentationVisitor()

    return {
      type: 'range',
      start: domain.start.accept(visitor) as MagnitudeApplicationDto,
      end: domain.end.accept(visitor) as MagnitudeApplicationDto,
      average: domain.average ? (domain.average.accept(visitor) as MagnitudeApplicationDto) : undefined,
      isSingleValue: domain.isSingleValue(),
      unit: domain.unit,
    }
  }
}
