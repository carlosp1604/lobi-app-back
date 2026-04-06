import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export type LocationProps = {
  lat: number
  lng: number
}

export class Location extends ValueObject<LocationProps> {
  private __locationBrand: void

  private constructor(props: LocationProps) {
    super(props)
  }

  public static safeCreate(props: LocationProps): Result<Location, SharedDomainException> {
    const isValidLatitude = !isNaN(props.lat) && props.lat >= -90 && props.lat <= 90
    const isValidLongitude = !isNaN(props.lng) && props.lng >= -180 && props.lng <= 180

    if (!isValidLatitude || !isValidLongitude) {
      return fail(SharedDomainException.invalidLocation(String(props.lat), String(props.lng)))
    }

    const normalizedLatitude = Number(props.lat.toFixed(8))
    const normalizedLongitude = Number(props.lng.toFixed(8))

    return success(new Location({ lat: normalizedLatitude, lng: normalizedLongitude }))
  }

  public static fromProps(props: LocationProps): Location {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Location | null): boolean {
    if (vo === null || vo === undefined || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.lat === vo._value.lat && this._value.lng === vo._value.lng
  }

  public toString(): string {
    return `${this._value.lat}, ${this._value.lng}`
  }

  public toDTO() {
    return {
      lat: this._value.lat,
      lng: this._value.lng,
    }
  }
}
