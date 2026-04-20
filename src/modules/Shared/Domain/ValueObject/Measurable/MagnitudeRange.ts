import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/VisitableMeasurableValueInterface'

export type Rangeable<T> = ValueObject<unknown> & OrderableMagnitudeInterface<T> & VisitableMeasurableValueInterface

export type MagnitudeRangeProps<T> = {
  start: T
  end: T
}

export class MagnitudeRange<T extends Rangeable<T>>
  extends ValueObject<MagnitudeRangeProps<T>>
  implements VisitableMeasurableValueInterface
{
  private constructor(props: MagnitudeRangeProps<T>) {
    super(props)
  }

  public static safeCreate<T extends Rangeable<T>>(
    start: T,
    end: T,
    formatVisitor: MeasurableValueVisitorInterface<string>,
  ): Result<MagnitudeRange<T>, SharedDomainException> {
    if (start.isGreaterThan(end)) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.accept(formatVisitor), end.accept(formatVisitor)))
    }

    return success(new MagnitudeRange({ start, end }))
  }

  public toString(): string {
    return `(${this._value.start.toString()}) - (${this._value.end.toString()})`
  }

  public equals(vo?: ValueObject<MagnitudeRangeProps<T>> | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.start.equals(vo.value.start) && this._value.end.equals(vo.value.end)
  }

  public isSingleValue(): boolean {
    return this._value.start.isEqual(this._value.end)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitMagnitudeRange(this)
  }

  get start(): T {
    return this._value.start
  }

  get end(): T {
    return this._value.end
  }
}
