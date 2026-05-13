import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import { DistanceCapability, DistanceCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/DistanceCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type DistanceCapabilityRawData = {
  start: string
  end: string
  unit: string
}

export class DistanceCapabilityPayloadContract implements CapabilityPayloadContractInterface<DistanceCapabilityInputProps> {
  public static readonly capabilityName = 'distance'

  public validate(rawData: unknown): Result<DistanceCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<DistanceCapabilityRawData>(rawData, {
      start: 'string',
      end: 'string',
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const dataValue = typeCheck.value

    return success({
      start: {
        unit: dataValue.unit,
        value: dataValue.start,
      },
      end: {
        unit: dataValue.unit,
        value: dataValue.end,
      },
    })
  }

  public getSchema(): ScalarCapabilitySchemaDto {
    return {
      name: DistanceCapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: [],
      defaultUnit: DistanceCapability.defaultUnit,
      supportedUnits: DistanceCapability.supportedUnits,
      availableFields: ['start', 'end'],
      limits: {
        min: DistanceCapability.minDistance.stringValue,
        max: DistanceCapability.maxDistance.stringValue,
      },
    }
  }
}
