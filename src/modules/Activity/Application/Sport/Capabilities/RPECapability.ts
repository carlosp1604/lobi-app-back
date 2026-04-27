import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
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

export type RPECapabilityRawData = {
  start: string
  end?: string
  average?: string
}

export class RPECapability extends SportBaseCapability<MagnitudeRange<RPE>, RPECapabilityRawData> {
  public readonly capabilityName = 'rpe'

  protected validateData(data: unknown): Result<RPECapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<RPECapabilityRawData>(data, {
      start: 'string',
      end: { type: 'string', optional: true },
      average: { type: 'string', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: RPECapabilityRawData): Result<MagnitudeRange<RPE>, SportDomainException> {
    const { end, start, average } = data

    const startRPEResult = RPE.safeCreate(start)

    if (!startRPEResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startRPEResult.error.message))
    }

    const startRPE = startRPEResult.value
    let endRPE = startRPE

    if (end) {
      const endRPEResult = RPE.safeCreate(end)

      if (!endRPEResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endRPEResult.error.message))
      }

      endRPE = endRPEResult.value
    }

    let averageRPE: RPE | undefined

    if (average) {
      const averageRPEResult = RPE.safeCreate(average)

      if (!averageRPEResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, averageRPEResult.error.message))
      }

      averageRPE = averageRPEResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate({ start: startRPE, end: endRPE, average: averageRPE }, representationVisitor)

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
        defaultUnit: RPE.DEFAULT_UNIT,
        min: RPE.MIN_RPE,
        max: RPE.MAX_RPE,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<RPE>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<RPE>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
