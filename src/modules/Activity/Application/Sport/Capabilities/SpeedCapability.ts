import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { Speed, SupportedSpeedUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
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

export type SpeedCapabilityRawData = {
  start: string
  end?: string
  average?: string
  unit: string
}

export class SpeedCapability extends SportBaseCapability<MagnitudeRange<Speed>, SpeedCapabilityRawData> {
  public readonly capabilityName = 'speed'

  protected validateData(data: unknown): Result<SpeedCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<SpeedCapabilityRawData>(data, {
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

  protected performValidation(data: SpeedCapabilityRawData): Result<MagnitudeRange<Speed>, SportDomainException> {
    const { end, start, average, unit } = data

    const startSpeedResult = Speed.safeCreate({ value: start, unit })

    if (!startSpeedResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startSpeedResult.error.message))
    }

    const startSpeed = startSpeedResult.value
    let endSpeed = startSpeed

    if (end) {
      const endSpeedResult = Speed.safeCreate({ value: end, unit })

      if (!endSpeedResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endSpeedResult.error.message))
      }

      endSpeed = endSpeedResult.value
    }

    let averageSpeed: Speed | undefined

    if (average) {
      const averageSpeedResult = Speed.safeCreate({ value: average, unit })

      if (!averageSpeedResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, averageSpeedResult.error.message))
      }

      averageSpeed = averageSpeedResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(
      { start: startSpeed, end: endSpeed, average: averageSpeed },
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
        defaultUnit: Speed.DEFAULT_UNIT,
        min: Speed.MIN_SPEED.numericValue,
        max: Speed.MAX_SPEED.numericValue,
        units: SupportedSpeedUnits,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<Speed>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<Speed>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
