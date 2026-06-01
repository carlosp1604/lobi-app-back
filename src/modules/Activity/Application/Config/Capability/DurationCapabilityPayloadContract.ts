import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import {
  DurationCapability,
  DurationCapabilityInputProps,
  DurationCapabilityUnit,
} from '~/src/modules/Activity/Domain/Config/Capability/DurationCapability'

export type DurationCapabilityRawData = {
  start: string
  end: string
  unit: string
}

export class DurationCapabilityPayloadContract implements CapabilityPayloadContractInterface<DurationCapabilityInputProps> {
  public static readonly capabilityName = 'duration'

  public validate(rawData: unknown): Result<DurationCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<DurationCapabilityRawData>(rawData, {
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

  public getSchema(): ScalarCapabilitySchemaDto<DurationCapabilityUnit> {
    return {
      name: DurationCapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: [],
      defaultUnit: DurationCapability.defaultUnit,
      supportedUnits: DurationCapability.supportedUnits,
      availableFields: ['start', 'end'],
      limits: {
        min: DurationCapability.minDuration.toString(),
        max: DurationCapability.maxDuration.toString(),
      },
      conversionFactors: DurationCapability.conversionFactors,
    }
  }
}
