import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { Pace, SupportedPaceUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
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

export type PaceCapabilityRawData = {
  start: string
  end?: string
  average?: string
  unit: string
}

export class PaceCapability extends SportBaseCapability<MagnitudeRange<Pace>, PaceCapabilityRawData> {
  public readonly capabilityName = 'pace'

  protected validateData(data: unknown): Result<PaceCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<PaceCapabilityRawData>(data, {
      start: 'string',
      end: { type: 'string', optional: true },
      average: { type: 'string', optional: true },
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: PaceCapabilityRawData): Result<MagnitudeRange<Pace>, SportDomainException> {
    const { end, start, average, unit } = data

    const startPaceResult = Pace.safeCreate({ value: start, unit })

    if (!startPaceResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startPaceResult.error.message))
    }

    const startPace = startPaceResult.value
    let endPace = startPace

    if (end) {
      const endPaceResult = Pace.safeCreate({ value: end, unit })

      if (!endPaceResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endPaceResult.error.message))
      }

      endPace = endPaceResult.value
    }

    let averagePace: Pace | undefined

    if (average) {
      const averagePaceResult = Pace.safeCreate({ value: average, unit })

      if (!averagePaceResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, averagePaceResult.error.message))
      }

      averagePace = averagePaceResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(
      { start: startPace, end: endPace, average: averagePace },
      representationVisitor,
    )

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
        defaultUnit: Pace.DEFAULT_UNIT,
        min: Pace.MIN_PACE.numericValue,
        max: Pace.MAX_PACE.numericValue,
        units: SupportedPaceUnits,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<Pace>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<Pace>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
