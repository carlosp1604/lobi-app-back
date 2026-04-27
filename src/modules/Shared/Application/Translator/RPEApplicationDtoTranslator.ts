import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { MagnitudeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class RPEApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<RPE, MagnitudeApplicationDto> {
  public translate(domain: RPE): MagnitudeApplicationDto {
    const formattedRpe = `${domain.value}`

    return {
      type: 'scalar',
      value: domain.value,
      unit: 'rpe',
      formatted: {
        rpe: { short: formattedRpe, long: formattedRpe },
      },
    }
  }
}
