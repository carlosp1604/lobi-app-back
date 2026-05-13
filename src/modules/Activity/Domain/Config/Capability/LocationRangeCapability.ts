import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { Location, LocationInputProps } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { LocationRange, LocationRangePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/LocationRange'

export type LocationRangeCapabilityInputProps = {
  start: LocationInputProps
  end: LocationInputProps
}

export type LocationRangeCapabilityPrimitives = LocationRangePrimitives

export class LocationRangeCapability
  extends ValueObject<LocationRange>
  implements CapabilityInterface<LocationRangeCapabilityPrimitives>
{
  public static readonly capabilityName = 'location_range'

  private constructor(locationRange: LocationRange) {
    super(locationRange)
  }

  public static safeCreate(props: LocationRangeCapabilityInputProps): Result<LocationRangeCapability, ActivityDomainException> {
    const { start, end } = props

    const startResult = Location.safeCreate(start)
    if (!startResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startResult.error.message))
    }

    const startLocation = startResult.value
    let endLocation = startLocation

    if (end) {
      const endResult = Location.safeCreate(end)
      if (!endResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endResult.error.message))
      }
      endLocation = endResult.value
    }

    const locationRangeResult = LocationRange.safeCreate({ start: startLocation, end: endLocation })

    if (!locationRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, locationRangeResult.error.message))
    }

    return success(new LocationRangeCapability(locationRangeResult.value))
  }

  public static create(props: LocationRangeCapabilityInputProps): LocationRangeCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: LocationRangePrimitives): LocationRangeCapability {
    return new LocationRangeCapability(LocationRange.fromPrimitives(primitives))
  }

  public toPrimitives(): LocationRangeCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: LocationRangeCapability | null): boolean {
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
    return this._value.start
  }
}
