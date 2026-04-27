import { IndividualParticipation } from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { IndividualParticipationConfigurationApplicationDto } from '~/src/modules/Activity/Application/Dto/ParticipationConfigurationApplicationDto'

export class IndividualParticipationConfigurationApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<IndividualParticipation, IndividualParticipationConfigurationApplicationDto>
{
  public translate(domain: IndividualParticipation): IndividualParticipationConfigurationApplicationDto {
    return {
      type: 'individual',
      minCapacity: domain.minCapacity.value,
      maxCapacity: domain.maxCapacity.value,
    }
  }
}
