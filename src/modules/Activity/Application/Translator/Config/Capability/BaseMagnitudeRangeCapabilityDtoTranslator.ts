import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { MagnitudeRangeCapabilityDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'
import { MagnitudeRangeCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/MagnitudeRangeCapability'

export abstract class BaseMagnitudeRangeCapabilityDtoTranslator<T extends MagnitudeRangeCapabilityPrimitives<unknown>>
  implements DtoTranslatorInterface<T, MagnitudeRangeCapabilityDto>
{
  public translate(primitives: T): MagnitudeRangeCapabilityDto {
    const { start, end, average } = primitives

    const translatedStart = this.translateScalar(start)
    const translatedEnd = this.translateScalar(end)

    const translatedAvg = average ? this.translateScalar(average) : undefined

    const isSingleValue = this.isSingleValue(start, end)

    const capabilityName = this.getCapabilityName()

    return {
      type: 'scalar_range',
      name: capabilityName,
      data: {
        start: translatedStart,
        end: translatedEnd,
        average: translatedAvg,
        isSingleValue,
        unit: translatedStart.unit,
      },
    }
  }

  protected abstract getCapabilityName(): AvailableCapability
  protected abstract translateScalar(raw: T['start']): MagnitudeDto
  protected abstract isSingleValue(start: T['start'], end: T['end']): boolean
}
