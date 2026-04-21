import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'

export type LocationProps = {
  lat: BoundedNumber
  lng: BoundedNumber
}

export type LocationInputProps = {
  lat: string
  lng: string
}

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

    const isLatValid = lat.greaterThanOrEqual(this.MIN_LAT) && lat.lessThanOrEqual(this.MAX_LAT)
    const isLngValid = lng.greaterThanOrEqual(this.MIN_LNG) && lng.lessThanOrEqual(this.MAX_LNG)

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

    return this._value.lat.equals(vo._value.lat) && this._value.lng.equals(vo._value.lng)
  }

  public toString(): string {
    return `${this._value.lat.numericValue}, ${this._value.lng.numericValue}`
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitLocation(this)
  }
}
