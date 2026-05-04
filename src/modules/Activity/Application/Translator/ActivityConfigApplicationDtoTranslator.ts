import { SportRegistry } from '~/src/modules/Activity/Application/Sport/SportRegistry'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Sport/Sport'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'
import { ActivityConfigApplicationDto } from '~/src/modules/Activity/Application/Dto/ActivityConfigApplicationDto'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class ActivityConfigApplicationDtoTranslator
  implements ApplicationDtoTranslatorInterface<ActivityValidatedConfig, ActivityConfigApplicationDto>
{
  public translate(domain: ActivityValidatedConfig): ActivityConfigApplicationDto {
    const result: ActivityConfigApplicationDto = {
      capabilities: {},
      specs: {},
    }

    for (const [name, vo] of Object.entries(domain.capabilities)) {
      const capability = SportRegistry.getCapability(name as AvailableCapability)

      if (!capability) {
        throw Error(`System error: Capability validator for '${name}' is not registered`)
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      result.capabilities[name] = capability.translate(vo as any)
    }

    const participantsSpec = SportRegistry.getParticipantsSpec()

    result.specs.participants = participantsSpec.translate(domain.specs.participants)

    return result
  }
}
