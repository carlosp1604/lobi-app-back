import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { GeographicCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import { LocationCapability, LocationCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/LocationCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type LocationCapabilityRawData = {
  lat: string
  lng: string
}

export class LocationCapabilityPayloadContract implements CapabilityPayloadContractInterface<LocationCapabilityInputProps> {
  public static readonly capabilityName = 'location'

  public validate(rawData: unknown): Result<LocationCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<LocationCapabilityRawData>(rawData, {
      lat: 'string',
      lng: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const { lat, lng } = typeCheck.value

    return success({ lat, lng })
  }

  public getSchema(): GeographicCapabilitySchemaDto {
    return {
      name: LocationCapability.capabilityName,
      type: 'geographic_point',
      isRequired: false,
    }
  }
}
