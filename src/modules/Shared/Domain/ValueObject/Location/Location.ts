import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/BoundedNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export type LocationProps = {
  lat: BoundedNumber
  lng: BoundedNumber
}

export type LocationInputProps = {
  lat: string
  lng: string
}

export type LocationPrimitives = LocationInputProps

export class Location extends ValueObject<LocationProps> implements SerializableInterface<LocationPrimitives> {
  private __locationBrand: void

  public static readonly MIN_LAT = BoundedNumber.create('-90')
  public static readonly MAX_LAT = BoundedNumber.create('90')
  public static readonly MIN_LNG = BoundedNumber.create('-180')
  public static readonly MAX_LNG = BoundedNumber.create('180')

  private constructor(props: LocationProps) {
    super(props)
  }

  public static safeCreate(props: LocationInputProps): Result<Location, SharedDomainException> {
    const latResult = BoundedNumber.safeCreate(props.lat)
    const lngResult = BoundedNumber.safeCreate(props.lng)

    if (!latResult.success || !lngResult.success) {
      return fail(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    }

    const lat = latResult.value
    const lng = lngResult.value

    const isLatValid = lat.isGreaterThanOrEqual(this.MIN_LAT) && lat.isLessThanOrEqual(this.MAX_LAT)
    const isLngValid = lng.isGreaterThanOrEqual(this.MIN_LNG) && lng.isLessThanOrEqual(this.MAX_LNG)

    if (!isLatValid || !isLngValid) {
      return fail(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    }

    return success(new Location({ lat, lng }))
  }

  public static create(props: LocationInputProps): Location {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: LocationPrimitives): Location {
    return Location.create({ lat: primitives.lat, lng: primitives.lng })
  }

  public equals(vo?: Location | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const { lat, lng } = this._value

    return lat.equals(vo._value.lat) && lng.equals(vo._value.lng)
  }

  public toString(): string {
    const { lat, lng } = this._value

    return `${lat.toString()}, ${lng.toString()}`
  }

  public toPrimitives(): LocationPrimitives {
    const { lat, lng } = this._value

    return {
      lat: lat.toPrimitives(),
      lng: lng.toPrimitives(),
    }
  }

  get lat(): BoundedNumber {
    return this._value.lat
  }

  get lng(): BoundedNumber {
    return this._value.lng
  }
}
