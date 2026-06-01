import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { RouteCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import { RouteCapability, RouteCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/RouteCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type RouteCapabilityRawData = {
  points: Array<{ lat: string; lng: string }>
  isPublic: boolean
}

export class RouteCapabilityPayloadContract implements CapabilityPayloadContractInterface<RouteCapabilityInputProps> {
  public static readonly capabilityName = 'route'

  public validate(rawData: unknown): Result<RouteCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<RouteCapabilityRawData>(rawData, {
      points: {
        type: 'array',
        items: { type: 'object', schema: { lat: 'string', lng: 'string' } },
      },
      isPublic: 'boolean',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const { points, isPublic } = typeCheck.value

    return success({
      points: points.map((point) => ({ lat: point.lat, lng: point.lng })),
      isPublic,
    })
  }

  public getSchema(): RouteCapabilitySchemaDto {
    return {
      name: RouteCapability.capabilityName,
      type: 'route',
      isRequired: false,
      limits: {
        min: RouteCapability.minPoints,
        max: RouteCapability.maxPoints,
      },
    }
  }
}
