import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LocationApplicationDto } from '~/src/modules/Shared/Application/DTO/LocationApplicationDto'
import { Route, RoutePrimitiveProps } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Route'
import { LocationApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationApplicationDtoTranslator'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'

export type RouteCapabilityRawData = {
  points: Array<{ lat: string; lng: string }>
  isPublic?: boolean
}

export class RouteCapability extends SportBaseCapability<Route, RouteCapabilityRawData> {
  public readonly capabilityName = 'route'

  protected validateData(data: unknown): Result<RouteCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<RouteCapabilityRawData>(data, {
      points: {
        type: 'array',
        items: { type: 'object', schema: { lat: 'string', lng: 'string' } },
      },
      isPublic: { type: 'boolean', optional: true },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: RouteCapabilityRawData): Result<Route, SportDomainException> {
    const { points, isPublic } = data

    const locations: Array<Location> = []

    for (const [index, point] of points.entries()) {
      const locationResult = Location.safeCreate(point)

      if (!locationResult.success) {
        return fail(
          SportDomainException.capabilityValidationFailed(
            this.capabilityName,
            `Point at index ${index} is invalid: ${locationResult.error.message}`,
          ),
        )
      }

      locations.push(locationResult.value)
    }

    const routeResult = Route.safeCreate({ points: locations, isPublic })

    if (!routeResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, routeResult.error.message))
    }

    return success(routeResult.value)
  }

  public getSchema(): CapabilitySchema {
    return {
      name: this.capabilityName,
      data: {
        type: 'array',
        defaultVisibility: 'private',
        min: Route.MIN_POINTS,
        max: Route.MAX_POINTS,
        lat: {
          min: Location.MIN_LAT.numericValue,
          max: Location.MAX_LAT.numericValue,
        },
        lng: {
          min: Location.MIN_LNG.numericValue,
          max: Location.MAX_LNG.numericValue,
        },
        precision: BoundedNumber.DEFAULT_PRECISION,
      },
    }
  }

  public toPrimitives(value: Route): RoutePrimitiveProps {
    return value.toPrimitives()
  }

  public translate(value: Route): Array<LocationApplicationDto> {
    return value.points.map((point) => new LocationApplicationDtoTranslator().translate(point))
  }
}
