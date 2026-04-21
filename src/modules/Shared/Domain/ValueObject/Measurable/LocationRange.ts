import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export type LocationRangeProps = {
  start: Location
  end: Location
}

export class LocationRange extends ValueObject<LocationRangeProps> implements VisitableMeasurableValueInterface {
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
    return `(${this._value.start.toString()}) - (${this._value.end.toString()})`
  }

  public equals(vo?: LocationRange | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.start.equals(vo.value.start) && this._value.end.equals(vo.value.end)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitLocationRange(this)
  }

  get start(): Location {
    return this._value.start
  }

  get end(): Location {
    return this._value.end
  }
}
