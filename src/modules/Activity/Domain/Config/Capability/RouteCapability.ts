import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { Route, RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { Location, LocationInputProps } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'

export type RouteCapabilityInputProps = {
  points: Array<LocationInputProps>
  isPublic: boolean
}
export type RouteCapabilityPrimitives = RoutePrimitives

export class RouteCapability extends ValueObject<Route> implements CapabilityInterface<RouteCapabilityPrimitives> {
  public static readonly capabilityName = 'route'
  public static readonly minPoints = Route.MIN_POINTS
  public static readonly maxPoints = Route.MAX_POINTS

  private constructor(route: Route) {
    super(route)
  }

  public static safeCreate(props: RouteCapabilityInputProps): Result<RouteCapability, ActivityDomainException> {
    const { points, isPublic } = props

    const locations: Array<Location> = []

    for (const [index, point] of points.entries()) {
      const locationResult = Location.safeCreate(point)

      if (!locationResult.success) {
        return fail(
          ActivityDomainException.invalidCapabilityConfiguration(
            this.capabilityName,
            `Point at index ${index} is invalid: ${locationResult.error.message}`,
          ),
        )
      }

      locations.push(locationResult.value)
    }

    const routeResult = Route.safeCreate({ points: locations, isPublic })

    if (!routeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, routeResult.error.message))
    }

    return success(new RouteCapability(routeResult.value))
  }

  public static create(props: RouteCapabilityInputProps): RouteCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(props: RoutePrimitives): RouteCapability {
    return new RouteCapability(Route.fromPrimitives(props))
  }

  public toPrimitives(): RouteCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: RouteCapability | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(vo._value)
  }

  public toString(): string {
    return this._value.toString()
  }

  public get startLocation(): Location {
    return this._value.points[0]
  }
}
