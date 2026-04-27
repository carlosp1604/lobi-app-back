import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Location, LocationPrimitiveProps } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'

export type LocationRangeProps = {
  start: Location
  end: Location
}

export type LocationRangePrimitiveProps = {
  start: LocationPrimitiveProps
  end: LocationPrimitiveProps
}

export class LocationRange extends ValueObject<LocationRangeProps> implements SerializableInterface<LocationRangePrimitiveProps> {
  private __locationRangeBrand: void

  private constructor(props: LocationRangeProps) {
    super(props)
  }

  public static safeCreate(props: LocationRangeProps): Result<LocationRange, SharedDomainException> {
    return success(new LocationRange(props))
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

  public toPrimitives(): LocationRangePrimitiveProps {
    const { start, end } = this._value

    return {
      start: start.toPrimitives(),
      end: end.toPrimitives(),
    }
  }
}
