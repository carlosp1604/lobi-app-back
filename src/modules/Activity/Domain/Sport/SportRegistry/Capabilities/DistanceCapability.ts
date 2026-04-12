import {
  SportBaseCapability,
  SportCapabilityRawData,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Distance'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'

export type DistanceCapabilityRawData = {
  value: number
  unit: string
}

export class DistanceCapability implements SportBaseCapability<Distance> {
  public readonly flagName = 'allowDistance'
  public readonly capabilityName = 'distance'

  public validate(rawValue: SportCapabilityRawData): Result<Distance, SportDomainException> {
    const typeCheck = TypeValidator.validate<DistanceCapabilityRawData>(rawValue, {
      value: 'number',
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, typeCheck.error))
    }

    const payload = typeCheck.value

    const distanceResult = Distance.safeCreate({ value: payload.value, unit: payload.unit })

    if (!distanceResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, distanceResult.error.message))
    }

    return success(distanceResult.value)
  }
}
