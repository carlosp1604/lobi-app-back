import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'
import { Altitude, SupportedAltitudeUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
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

export type AltitudeCapabilityRawData = {
  start: string
  end?: string
  average?: string
  unit: string
}

export class AltitudeCapability extends SportBaseCapability<MagnitudeRange<Altitude>, AltitudeCapabilityRawData> {
  public readonly capabilityName = 'altitude'

  protected validateData(data: unknown): Result<AltitudeCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<AltitudeCapabilityRawData>(data, {
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

  protected performValidation(data: AltitudeCapabilityRawData): Result<MagnitudeRange<Altitude>, SportDomainException> {
    const { end, start, average, unit } = data

    const startAltitudeResult = Altitude.safeCreate({ value: start, unit })

    if (!startAltitudeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startAltitudeResult.error.message))
    }

    const startAltitude = startAltitudeResult.value
    let endAltitude = startAltitude

    if (end) {
      const endAltitudeResult = Altitude.safeCreate({ value: end, unit })

      if (!endAltitudeResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endAltitudeResult.error.message))
      }

      endAltitude = endAltitudeResult.value
    }

    let averageAltitude: Altitude | undefined

    if (average) {
      const averageAltitudeResult = Altitude.safeCreate({ value: average, unit })

      if (!averageAltitudeResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, averageAltitudeResult.error.message))
      }

      averageAltitude = averageAltitudeResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(
      { start: startAltitude, end: endAltitude, average: averageAltitude },
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
        defaultUnit: Altitude.DEFAULT_UNIT,
        min: Altitude.MIN_ALTITUDE.numericValue,
        max: Altitude.MAX_ALTITUDE.numericValue,
        units: SupportedAltitudeUnits,
      },
    }
  }

  public toPrimitives(value: MagnitudeRange<Altitude>): MagnitudeRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: MagnitudeRange<Altitude>): MagnitudeRangeApplicationDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(value)
  }
}
