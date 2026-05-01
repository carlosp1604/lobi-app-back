import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { SportRegistry } from '~/src/modules/Activity/Application/Sport/SportRegistry'
import { SportApplicationDto } from '~/src/modules/Activity/Application/Dto/SportApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class SportApplicationDtoTranslator implements ApplicationDtoTranslatorInterface<Sport, SportApplicationDto> {
  public translate(domain: Sport): SportApplicationDto {
    const capabilities = domain.capabilities.reduce<Record<string, unknown>>((accumulator, currentValue) => {
      const capability = SportRegistry.getCapability(currentValue)

      if (!capability) {
        throw Error(`System error: Capability validator for '${currentValue}' is not registered`)
      }

      accumulator[currentValue] = capability.getSchema()

      return accumulator
    }, {})

    const participantsSpec = SportRegistry.getParticipantsSpec()

    return {
      id: domain.id.value,
      slug: domain.slug.value,
      imageUrl: domain.imageUrl ? domain.imageUrl.value : null,
      config: {
        capabilities,
        specs: {
          participants: participantsSpec.getSchema(domain.specs.participants),
        },
      },
    }
  }
}
