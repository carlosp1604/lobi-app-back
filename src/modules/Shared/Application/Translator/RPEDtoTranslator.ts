import { MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { RPE, RPEPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class RPEQueryDtoTranslator implements DtoTranslatorInterface<RPEPrimitives, MagnitudeDto> {
  public translate(primitives: RPEPrimitives): MagnitudeDto {
    const value = primitives.value

    return {
      type: 'scalar',
      value: value,
      unit: RPE.DEFAULT_UNIT,
      formatted: {
        rpe: { short: value, long: value },
      },
    }
  }
}
