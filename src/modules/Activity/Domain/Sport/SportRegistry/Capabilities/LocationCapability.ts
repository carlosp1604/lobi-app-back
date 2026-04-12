import {
  SportBaseCapability,
  SportCapabilityRawData,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'

export type LocationCapabilityRawData = {
  lat: number
  lng: number
}

export class LocationCapability implements SportBaseCapability<Location> {
  public readonly flagName = 'allowLocation'
  public readonly capabilityName = 'location'

  public validate(rawValue: SportCapabilityRawData): Result<Location, SportDomainException> {
    // 1. Validamos la estructura del objeto geográfico
    const typeCheck = TypeValidator.validate<LocationCapabilityRawData>(rawValue, {
      lat: 'number',
      lng: 'number',
    })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, typeCheck.error))
    }

    const payload = typeCheck.value

    const locationResult = Location.safeCreate({ lat: payload.lat, lng: payload.lng })

    if (!locationResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, locationResult.error.message))
    }

    return success(locationResult.value)
  }
}
