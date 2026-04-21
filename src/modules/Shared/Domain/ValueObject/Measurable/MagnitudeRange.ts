import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMeasurableValueInterface'

export type Rangeable<T> = ValueObject<unknown> & OrderableMagnitudeInterface<T> & VisitableMeasurableValueInterface

export type MagnitudeRangeProps<T> = {
  start: T
  end: T
  average?: T
}

export type MagnitudeRangeInputProps<T> = {
  start: T
  end: T
  average?: T
}

export class MagnitudeRange<T extends Rangeable<T>>
  extends ValueObject<MagnitudeRangeProps<T>>
  implements VisitableMeasurableValueInterface
{
  private constructor(props: MagnitudeRangeProps<T>) {
    super(props)
  }

  public static safeCreate<T extends Rangeable<T>>(
    props: MagnitudeRangeInputProps<T>,
    formatVisitor: MeasurableValueVisitorInterface<string>,
  ): Result<MagnitudeRange<T>, SharedDomainException> {
    if (props.start.isGreaterThan(props.end)) {
      return fail(SharedDomainException.invalidMagnitudeRange(props.start.accept(formatVisitor), props.end.accept(formatVisitor)))
    }

    if (props.average && (props.start.isGreaterThan(props.average) || props.average.isGreaterThan(props.end))) {
      return fail(
        SharedDomainException.invalidAverageValue(
          props.average.accept(formatVisitor),
          props.start.accept(formatVisitor),
          props.end.accept(formatVisitor),
        ),
      )
    }

    return success(new MagnitudeRange(props))
  }

  public toString(): string {
    return `(${this._value.start.toString()}) - (${this._value.end.toString()})`
  }

  public equals(vo?: MagnitudeRange<T> | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const bothHaveAverage = !!this.average && !!vo.average
    const neitherHasAverage = !this.average && !vo.average

    if (!neitherHasAverage) {
      if (!bothHaveAverage || !this.average?.equals(vo.average)) {
        return false
      }
    }

    return this._value.start.equals(vo.start) && this._value.end.equals(vo.end)
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

  get average(): T | undefined {
    return this._value.average
  }
}
