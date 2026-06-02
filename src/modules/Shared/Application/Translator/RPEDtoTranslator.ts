import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { RPE, RPEPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class RPEDtoTranslator implements DtoTranslatorInterface<RPEPrimitives, MagnitudeDto> {
  public translate(primitives: RPEPrimitives): MagnitudeDto {
    const value = primitives.value

    return {
      value: value,
      unit: RPE.DEFAULT_UNIT,
      formatted: {
        rpe: { short: value, long: value },
      },
    }
  }
}
