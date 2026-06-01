import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import {
  SpeedCapability,
  SpeedCapabilityInputProps,
  SpeedCapabilityUnit,
} from '~/src/modules/Activity/Domain/Config/Capability/SpeedCapability'

export type SpeedCapabilityRawData = {
  start: string
  end: string
  average?: string
  unit: string
}

export class SpeedCapabilityPayloadContract implements CapabilityPayloadContractInterface<SpeedCapabilityInputProps> {
  public static readonly capabilityName = 'speed'

  public validate(rawData: unknown): Result<SpeedCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<SpeedCapabilityRawData>(rawData, {
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

  public getSchema(): ScalarCapabilitySchemaDto<SpeedCapabilityUnit> {
    return {
      name: SpeedCapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: ['average'],
      defaultUnit: SpeedCapability.defaultUnit,
      supportedUnits: SpeedCapability.supportedUnits,
      availableFields: ['start', 'end', 'average'],
      limits: {
        min: SpeedCapability.minSpeed.stringValue,
        max: SpeedCapability.maxSpeed.stringValue,
      },
      conversionFactors: Object.keys(SpeedCapability.conversionFactors).reduce(
        (acc, key) => {
          const unit = key as SpeedCapabilityUnit
          acc[unit] = SpeedCapability.conversionFactors[unit].toString()
          return acc
        },
        {} as Record<SpeedCapabilityUnit, string>,
      ),
    }
  }
}
