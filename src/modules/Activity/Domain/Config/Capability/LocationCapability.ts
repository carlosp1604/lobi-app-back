import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { Location, LocationInputProps, LocationPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'

export type LocationCapabilityInputProps = LocationInputProps
export type LocationCapabilityPrimitives = LocationPrimitives

export class LocationCapability extends ValueObject<Location> implements CapabilityInterface<LocationCapabilityPrimitives> {
  public static readonly capabilityName = 'location'

  private constructor(location: Location) {
    super(location)
  }

  public static safeCreate(props: LocationCapabilityInputProps): Result<LocationCapability, ActivityDomainException> {
    const locationResult = Location.safeCreate(props)

    if (!locationResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, locationResult.error.message))
    }

    return success(new LocationCapability(locationResult.value))
  }

  public static create(props: LocationCapabilityInputProps): LocationCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: LocationCapabilityPrimitives): LocationCapability {
    return new LocationCapability(Location.fromPrimitives(primitives))
  }

  public toPrimitives(): LocationCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: LocationCapability | null): boolean {
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

  public get location(): Location {
    return this._value
  }
}
