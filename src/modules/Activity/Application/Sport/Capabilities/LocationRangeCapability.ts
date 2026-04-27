import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LocationRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { LocationRangeApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationRangeApplicationDtoTranslator'
import { LocationRange, LocationRangePrimitiveProps } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'

export type LocationPointRaw = { lat: string; lng: string }

export type LocationRangeCapabilityRawData = {
  start: LocationPointRaw
  end?: LocationPointRaw
}

export class LocationRangeCapability extends SportBaseCapability<LocationRange, LocationRangeCapabilityRawData> {
  public readonly capabilityName = 'location_range'

  protected validateData(data: unknown): Result<LocationRangeCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<LocationRangeCapabilityRawData>(data, {
      start: { schema: { lat: 'string', lng: 'string' }, type: 'object' },
      end: { schema: { lat: 'string', lng: 'string' }, type: 'object', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: LocationRangeCapabilityRawData): Result<LocationRange, SportDomainException> {
    const { start, end } = data

    const startResult = Location.safeCreate(start)
    if (!startResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, startResult.error.message))
    }

    const startLocation = startResult.value
    let endLocation = startLocation

    if (end) {
      const endResult = Location.safeCreate(end)
      if (!endResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, endResult.error.message))
      }
      endLocation = endResult.value
    }

    const locationRangeResult = LocationRange.safeCreate({ start: startLocation, end: endLocation })

    if (!locationRangeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, locationRangeResult.error.message))
    }

    return success(locationRangeResult.value)
  }

  public getSchema(): CapabilitySchema {
    return {
      name: this.capabilityName,
      data: {
        type: 'range',
        lat: { min: Location.MIN_LAT, max: Location.MAX_LAT },
        lng: { min: Location.MIN_LNG, max: Location.MAX_LNG },
        precision: BoundedNumber.DEFAULT_PRECISION,
      },
    }
  }

  public toPrimitives(value: LocationRange): LocationRangePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: LocationRange): LocationRangeApplicationDto {
    return new LocationRangeApplicationDtoTranslator().translate(value)
  }
}
