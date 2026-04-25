import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export type LocationProps = {
  lat: BoundedNumber
  lng: BoundedNumber
}

export type LocationInputProps = {
  lat: string
  lng: string
}

export type LocationPrimitiveProps = LocationInputProps

export class Location extends ValueObject<LocationProps> implements VisitableMeasurableValueInterface {
  private __locationBrand: void

  public static readonly MIN_LAT = BoundedNumber.fromString('-90')
  public static readonly MAX_LAT = BoundedNumber.fromString('90')
  public static readonly MIN_LNG = BoundedNumber.fromString('-180')
  public static readonly MAX_LNG = BoundedNumber.fromString('180')

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

  public static fromProps(props: LocationInputProps): Location {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
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

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitLocation(this)
  }

  public toPrimitives(): LocationPrimitiveProps {
    const { lat, lng } = this._value

    return {
      lat: lat.toPrimitives(),
      lng: lng.toPrimitives(),
    }
  }
}
