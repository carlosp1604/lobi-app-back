import { RawActivityConfig } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ActivityValidatedConfig'
import { AvailableCapability, Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { SportRegistry, ValidatedCapabilities, ValidatedSpecs } from '~/src/modules/Activity/Application/Sport/SportRegistry'

export class ActivityValidatedConfigTranslator {
  public static toDomain(rawConfig: RawActivityConfig, sport: Sport): Result<ActivityValidatedConfig, Error> {
    const capabilities: ValidatedCapabilities = {}
    const specs: ValidatedSpecs = {}

    for (const name of sport.capabilities) {
      const rawData = rawConfig.capabilities[name]

      if (rawData) {
        const capability = SportRegistry.getCapability(name)

        if (!capability) {
          throw Error(`Invalid capability found in RawActivityConfig: ${name}`)
        }

        const result = capability.validate(rawData)

        if (!result.success) {
          return fail(Error(`${name} capability validation failed: ${result.error.message}`))
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        capabilities[capability.capabilityName] = result.value as any
      }
    }

    if (rawConfig.specs?.participants) {
      const participantsSpec = SportRegistry.getParticipantsSpec(sport.specs.participants)

      const result = participantsSpec.validate(rawConfig.specs.participants)

      if (!result.success) {
        return fail(Error(`Participants spec validation failed: ${result.error.message}`))
      }

      specs.participants = result.value
    }

    return success(ActivityValidatedConfig.fromProps(sport, capabilities, specs))
  }

  public static toDatabase(domain: ActivityValidatedConfig): Result<RawActivityConfig, Error> {
    const capabilities: Record<string, unknown> = {}

    for (const [name, vo] of Object.entries(domain.capabilities)) {
      const capability = SportRegistry.getCapability(name as AvailableCapability)

      if (!capability) {
        return fail(Error(`Invalid capability found in ActivityValidatedConfig: ${name}`))
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      capabilities[name] = capability.toPrimitives(vo as any)
    }

    const participantsSpec = domain.specs.participants

    return success({
      capabilities,
      specs: {
        participants: participantsSpec ? participantsSpec.toPrimitives() : undefined,
      },
    })
  }
}
