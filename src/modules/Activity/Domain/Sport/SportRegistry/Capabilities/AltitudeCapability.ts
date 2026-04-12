import {
  SportBaseCapability,
  SportCapabilityRawData,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Altitude'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'

export type AltitudeCapabilityRawData = {
  value: number
  unit: string
}

export class AltitudeCapability implements SportBaseCapability<Altitude> {
  public readonly flagName = 'allowAltitude'
  public readonly capabilityName = 'altitude'

  public validate(rawValue: SportCapabilityRawData): Result<Altitude, SportDomainException> {
    const typeCheck = TypeValidator.validate<AltitudeCapabilityRawData>(rawValue, {
      value: 'number',
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, typeCheck.error))
    }

    const payload = typeCheck.value

    const altitudeResult = Altitude.safeCreate({ value: payload.value, unit: payload.unit })

    if (!altitudeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, altitudeResult.error.message))
    }

    return success(altitudeResult.value)
  }
}
