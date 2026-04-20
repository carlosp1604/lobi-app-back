import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { Duration, SupportedDurationUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Duration'
import { MeasurableToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToRepresentationVisitor'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import {
  MeasurableToPresentationVisitor,
  PresentationMeasurableValueDto,
} from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToPresentationVisitor'

export type DurationCapabilityRawData = {
  start: string
  end?: string
}

export class DurationCapability extends SportBaseCapability<MagnitudeRange<Duration>, DurationCapabilityRawData> {
  public readonly capabilityName = 'duration'

  protected validateData(data: unknown): Result<DurationCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<DurationCapabilityRawData>(data, {
      start: 'string',
      end: { type: 'string', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: DurationCapabilityRawData): Result<MagnitudeRange<Duration>, SportDomainException> {
    const { end, start } = data

    const startDurationResult = Duration.safeCreate(start)
    if (!startDurationResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startDurationResult.error.message))
    }

    const startDuration = startDurationResult.value
    let endDuration = startDuration

    if (end) {
      const endDurationResult = Duration.safeCreate(end)

      if (!endDurationResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endDurationResult.error.message))
      }

      endDuration = endDurationResult.value
    }

    const representationVisitor = new MeasurableToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(startDuration, endDuration, representationVisitor)

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
        defaultUnit: Duration.DEFAULT_UNIT,
        min: Duration.MIN_DURATION_SECONDS.numericValue,
        max: Duration.MAX_DURATION_SECONDS.numericValue,
        units: SupportedDurationUnits,
      },
    }
  }

  public translate(vo: MagnitudeRange<Duration>): PresentationMeasurableValueDto {
    return vo.accept(new MeasurableToPresentationVisitor())
  }
}
