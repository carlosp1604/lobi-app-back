import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { Distance, SupportedDistanceUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/Visitor/MagnitudeToRepresentationVisitor'
import { MagnitudeRangeApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/MagnitudeRangeApplicationDtoTranslator'
import {
  MagnitudeRange,
  MagnitudeRangePrimitiveProps,
} from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'

export type DistanceCapabilityRawData = {
  start: string
  end?: string
  unit: string
}

export class DistanceCapability extends SportBaseCapability<MagnitudeRange<Distance>, DistanceCapabilityRawData> {
  public readonly capabilityName = 'distance'

  protected validateData(data: unknown): Result<DistanceCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<DistanceCapabilityRawData>(data, {
      start: 'string',
      end: { type: 'string', optional: true },
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: DistanceCapabilityRawData): Result<MagnitudeRange<Distance>, SportDomainException> {
    const { end, start, unit } = data

    const startDistanceResult = Distance.safeCreate({ value: start, unit })

    if (!startDistanceResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startDistanceResult.error.message))
    }

    const startDistance = startDistanceResult.value
    let endDistance = startDistance

    if (end) {
      const endDistanceResult = Distance.safeCreate({ value: end, unit })

      if (!endDistanceResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endDistanceResult.error.message))
      }

      endDistance = endDistanceResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate({ start: startDistance, end: endDistance }, representationVisitor)

    if (!magnitudeRangeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(magnitudeRangeResult.value)
  }

  public getSchema(): CapabilitySchema {
    return {
      name: this.capabilityName,
      data: {
        type: 'range',
        defaultUnit: Distance.DEFAULT_UNIT,
        min: Distance.MIN_DISTANCE.numericValue,
        max: Distance.MAX_DISTANCE.numericValue,
        units: SupportedDistanceUnits,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<Distance>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<Distance>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
