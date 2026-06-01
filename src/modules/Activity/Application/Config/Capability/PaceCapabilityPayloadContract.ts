import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import {
  PaceCapability,
  PaceCapabilityInputProps,
  PaceCapabilityUnit,
} from '~/src/modules/Activity/Domain/Config/Capability/PaceCapability'

export type PaceCapabilityRawData = {
  start: string
  end: string
  average?: string
  unit: string
}

export class PaceCapabilityPayloadContract implements CapabilityPayloadContractInterface<PaceCapabilityInputProps> {
  public static readonly capabilityName = 'pace'

  public validate(rawData: unknown): Result<PaceCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<PaceCapabilityRawData>(rawData, {
      start: 'string',
      end: 'string',
      average: { type: 'string', optional: true },
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    const dataValue = typeCheck.value

    const average = dataValue.average
      ? {
          unit: dataValue.unit,
          value: dataValue.average,
        }
      : undefined

    return success({
      start: {
        unit: dataValue.unit,
        value: dataValue.start,
      },
      end: {
        unit: dataValue.unit,
        value: dataValue.end,
      },
      average,
    })
  }

  public getSchema(): ScalarCapabilitySchemaDto<PaceCapabilityUnit> {
    return {
      name: PaceCapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: ['average'],
      defaultUnit: PaceCapability.defaultUnit,
      supportedUnits: PaceCapability.supportedUnits,
      availableFields: ['start', 'end', 'average'],
      limits: {
        min: PaceCapability.minPace.toString(),
        max: PaceCapability.maxPace.toString(),
      },
      conversionFactors: Object.keys(PaceCapability.conversionFactors).reduce(
        (acc, key) => {
          const unit = key as PaceCapabilityUnit
          acc[unit] = PaceCapability.conversionFactors[unit].toString()
          return acc
        },
        {} as Record<PaceCapabilityUnit, string>,
      ),
    }
  }
}
