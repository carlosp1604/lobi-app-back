import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToRepresentationVisitor'
import { Distance, SupportedDistanceUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Distance'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import {
  MeasurableToPresentationVisitor,
  PresentationMeasurableValueDto,
} from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToPresentationVisitor'

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
      const endDistResult = Distance.safeCreate({ value: end, unit })

      if (!endDistResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endDistResult.error.message))
      }

      endDistance = endDistResult.value
    }

    const representationVisitor = new MeasurableToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(startDistance, endDistance, representationVisitor)

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

  public translate(vo: MagnitudeRange<Distance>): PresentationMeasurableValueDto {
    return vo.accept(new MeasurableToPresentationVisitor())
  }
}
