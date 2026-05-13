import { MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { RPE, RPEPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class RPEQueryDtoTranslator implements ApplicationDtoTranslatorInterface<RPEPrimitives, MagnitudeQueryDto> {
  public translate(primitives: RPEPrimitives): MagnitudeQueryDto {
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
