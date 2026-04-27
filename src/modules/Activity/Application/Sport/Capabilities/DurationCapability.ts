import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { Duration, SupportedDurationUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
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

export type DurationCapabilityRawData = {
  start: number
  end?: number
}

export class DurationCapability extends SportBaseCapability<MagnitudeRange<Duration>, DurationCapabilityRawData> {
  public readonly capabilityName = 'duration'

  protected validateData(data: unknown): Result<DurationCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<DurationCapabilityRawData>(data, {
      start: 'number',
      end: { type: 'number', optional: true },
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

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate({ start: startDuration, end: endDuration }, representationVisitor)

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
        min: Duration.MIN_DURATION_SECONDS.value,
        max: Duration.MAX_DURATION_SECONDS.value,
        units: SupportedDurationUnits,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<Duration>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<Duration>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
