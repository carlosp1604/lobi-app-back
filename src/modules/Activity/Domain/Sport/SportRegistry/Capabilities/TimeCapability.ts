import {
  SportBaseCapability,
  SportCapabilityRawData,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Time } from '~/src/modules/Shared/Domain/ValueObject/Time'

export type TimeCapabilityRawData = {
  value: string | number
}

export class TimeCapability implements SportBaseCapability<Time> {
  public readonly flagName = 'allowTime'
  public readonly capabilityName = 'time'

  public validate(rawValue: SportCapabilityRawData): Result<Time, SportDomainException> {
    const typeCheck = TypeValidator.validate<TimeCapabilityRawData>(rawValue, {
      value: ['string', 'number'],
    })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, typeCheck.error))
    }

    const payload = typeCheck.value

    const timeResult =
      typeof payload.value === 'string' ? Time.safeCreateFromString(payload.value) : Time.safeCreateFromSeconds(payload.value)

    if (!timeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, timeResult.error.message))
    }

    return success(timeResult.value)
  }
}
