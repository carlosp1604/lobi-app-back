import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { GeographicCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import {
  LocationRangeCapability,
  LocationRangeCapabilityInputProps,
} from '~/src/modules/Activity/Domain/Config/Capability/LocationRangeCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type LocationPointRaw = { lat: string; lng: string }

export type LocationRangeCapabilityRawData = {
  start: LocationPointRaw
  end: LocationPointRaw
}

export class LocationRangeCapabilityPayloadContract implements CapabilityPayloadContractInterface<LocationRangeCapabilityInputProps> {
  public static readonly capabilityName = 'location_range'

  public validate(rawData: unknown): Result<LocationRangeCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<LocationRangeCapabilityRawData>(rawData, {
      start: { schema: { lat: 'string', lng: 'string' }, type: 'object' },
      end: { schema: { lat: 'string', lng: 'string' }, type: 'object' },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const dataValue = typeCheck.value

    return success({
      start: {
        lat: dataValue.start.lat,
        lng: dataValue.start.lng,
      },
      end: {
        lat: dataValue.end.lat,
        lng: dataValue.end.lng,
      },
    })
  }

  public getSchema(): GeographicCapabilitySchemaDto {
    return {
      name: LocationRangeCapability.capabilityName,
      type: 'geographic_range',
      isRequired: false,
    }
  }
}
