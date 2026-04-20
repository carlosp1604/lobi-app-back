import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { MeasurableToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToRepresentationVisitor'
import { Altitude, SupportedAltitudeUnits } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Altitude'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import {
  MeasurableToPresentationVisitor,
  PresentationMeasurableValueDto,
} from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableToPresentationVisitor'

export type AltitudeCapabilityRawData = {
  start: string
  end?: string
  unit: string
}

export class AltitudeCapability extends SportBaseCapability<MagnitudeRange<Altitude>, AltitudeCapabilityRawData> {
  public readonly capabilityName = 'altitude'

  protected validateData(data: unknown): Result<AltitudeCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<AltitudeCapabilityRawData>(data, {
      start: 'string',
      end: { type: 'string', optional: true },
      unit: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: AltitudeCapabilityRawData): Result<MagnitudeRange<Altitude>, SportDomainException> {
    const { end, start, unit } = data

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

    const representationVisitor = new MeasurableToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate(startAltitude, endAltitude, representationVisitor)

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

  public translate(vo: MagnitudeRange<Altitude>): PresentationMeasurableValueDto {
    return vo.accept(new MeasurableToPresentationVisitor())
  }
}
