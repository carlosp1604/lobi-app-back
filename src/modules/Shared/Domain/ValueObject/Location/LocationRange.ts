import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Location, LocationPrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'

export type LocationRangeProps = {
  start: Location
  end: Location
}

export type LocationRangePrimitives = {
  start: LocationPrimitives
  end: LocationPrimitives
}

export class LocationRange extends ValueObject<LocationRangeProps> implements SerializableInterface<LocationRangePrimitives> {
  private __locationRangeBrand: void

  private constructor(props: LocationRangeProps) {
    super(props)
  }

  public static safeCreate(props: LocationRangeProps): Result<LocationRange, SharedDomainException> {
    return success(new LocationRange(props))
  }

  public static create(props: LocationRangeProps): LocationRange {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: LocationRangePrimitives): LocationRange {
    const start = Location.create({ lng: primitives.start.lng, lat: primitives.start.lat })
    const end = Location.create({ lng: primitives.end.lng, lat: primitives.end.lng })

    return LocationRange.create({ start, end })
  }

  public isSingleValue(): boolean {
    return this._value.start.equals(this._value.end)
  }

  public toString(): string {
    const { start, end } = this._value

    return `(${start.toString()}) - (${end.toString()})`
  }

  public equals(vo?: LocationRange | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const { start, end } = this._value

    return start.equals(vo._value.start) && end.equals(vo._value.end)
  }

  public get start(): Location {
    return this._value.start
  }

  public get end(): Location {
    return this._value.end
  }

  public toPrimitives(): LocationRangePrimitives {
    const { start, end } = this._value

    return {
      start: start.toPrimitives(),
      end: end.toPrimitives(),
    }
  }
}
