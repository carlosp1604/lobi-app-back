import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import {
  RPECapability,
  RPECapabilityInputProps,
  RPECapabilityUnit,
} from '~/src/modules/Activity/Domain/Config/Capability/RPECapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'

export type RPECapabilityRawData = {
  start: string
  end: string
  average?: string
}

export class RPECapabilityPayloadContract implements CapabilityPayloadContractInterface<RPECapabilityInputProps> {
  public static readonly capabilityName = 'rpe'

  public validate(rawData: unknown): Result<RPECapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<RPECapabilityRawData>(rawData, {
      start: 'string',
      end: 'string',
      average: { type: 'string', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const { start, end, average } = typeCheck.value

    const averageData = average
      ? {
          unit: RPE.DEFAULT_UNIT,
          value: average,
        }
      : undefined

    return success({
      start: {
        unit: RPE.DEFAULT_UNIT,
        value: start,
      },
      end: {
        unit: RPE.DEFAULT_UNIT,
        value: end,
      },
      average: averageData,
    })
  }

  public getSchema(): ScalarCapabilitySchemaDto<RPECapabilityUnit> {
    return {
      name: RPECapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: ['average'],
      defaultUnit: RPECapability.defaultUnit,
      supportedUnits: RPECapability.supportedUnits,
      availableFields: ['start', 'end', 'average'],
      limits: {
        min: RPECapability.minRPE,
        max: RPECapability.maxRPE,
      },
      conversionFactors: RPECapability.conversionFactors,
    }
  }
}
