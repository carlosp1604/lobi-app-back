import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { AltitudeCapability, AltitudeCapabilityInputProps } from '~/src/modules/Activity/Domain/Config/Capability/AltitudeCapability'
import {
  CapabilityPayloadValidationError,
  CapabilityPayloadContractInterface,
} from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractInterface'
import { ScalarCapabilitySchemaDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilitySchemaDto'

export type AltitudeCapabilityRawData = {
  start: string
  end: string
  average?: string
  unit: string
}

export class AltitudeCapabilityPayloadContract implements CapabilityPayloadContractInterface<AltitudeCapabilityInputProps> {
  public static readonly capabilityName = 'altitude'

  public validate(rawData: unknown): Result<AltitudeCapabilityInputProps, CapabilityPayloadValidationError> {
    const typeCheck = TypeValidator.validate<AltitudeCapabilityRawData>(rawData, {
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

  public getSchema(): ScalarCapabilitySchemaDto {
    return {
      name: AltitudeCapability.capabilityName,
      type: 'scalar_range',
      isRequired: false,
      optionalFields: ['average'],
      defaultUnit: AltitudeCapability.defaultUnit,
      supportedUnits: AltitudeCapability.supportedUnits,
      availableFields: ['start', 'end', 'average'],
      limits: {
        min: AltitudeCapability.minAltitude.stringValue,
        max: AltitudeCapability.maxAltitude.stringValue,
      },
    }
  }
}
