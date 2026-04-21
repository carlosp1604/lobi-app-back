import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import {
  MeasurableToPresentationVisitor,
  PresentationMeasurableValueDto,
} from '~/src/modules/Shared/Domain/Visitor/MeasurableToPresentationVisitor'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'

export type LocationCapabilityRawData = {
  lat: string
  lng: string
}

export class LocationCapability extends SportBaseCapability<Location, LocationCapabilityRawData> {
  public readonly capabilityName = 'location'

  protected validateData(data: unknown): Result<LocationCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<LocationCapabilityRawData>(data, {
      lat: 'string',
      lng: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: LocationCapabilityRawData): Result<Location, SportDomainException> {
    const { lat, lng } = data

    const locationResult = Location.safeCreate({ lat, lng })

    if (!locationResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, locationResult.error.message))
    }

    return success(locationResult.value)
  }

  public getSchema(): CapabilitySchema {
    return {
      name: this.capabilityName,
      data: {
        lat: {
          min: Location.MIN_LNG,
          max: Location.MAX_LNG,
        },
        lng: {
          min: Location.MIN_LNG,
          max: Location.MAX_LNG,
        },
        precision: BoundedNumber.DEFAULT_PRECISION,
      },
    }
  }

  public translate(vo: Location): PresentationMeasurableValueDto {
    return vo.accept(new MeasurableToPresentationVisitor())
  }
}
