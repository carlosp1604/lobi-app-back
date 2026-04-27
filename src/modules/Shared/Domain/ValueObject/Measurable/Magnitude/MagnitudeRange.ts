import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMagnitudeValueInterface'

export type Rangeable<T> = ValueObject<unknown> &
  OrderableMagnitudeInterface<T> &
  VisitableMagnitudeValueInterface &
  SerializableInterface<unknown>

export type MagnitudeRangeProps<T> = {
  start: T
  end: T
  average?: T
}

export type MagnitudeRangePrimitiveProps = {
  start: unknown
  end: unknown
  average?: unknown
  unit: string
}

export type MagnitudeRangeInputProps<T> = {
  start: T
  end: T
  average?: T
}

export class MagnitudeRange<T extends Rangeable<T>>
  extends ValueObject<MagnitudeRangeProps<T>>
  implements VisitableMagnitudeValueInterface, SerializableInterface<MagnitudeRangePrimitiveProps>
{
  private constructor(props: MagnitudeRangeProps<T>) {
    super(props)
  }

  public static safeCreate<T extends Rangeable<T>>(
    props: MagnitudeRangeInputProps<T>,
    formatVisitor: MagnitudeValueVisitorInterface<string>,
  ): Result<MagnitudeRange<T>, SharedDomainException> {
    const { start, end, average } = props

    if (start.unit !== end.unit) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.unit, end.unit))
    }

    if (average && average.unit !== start.unit) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.unit, average.unit))
    }

    if (start.isGreaterThan(end)) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.accept(formatVisitor), end.accept(formatVisitor)))
    }

    if (average && (start.isGreaterThan(average) || average.isGreaterThan(end))) {
      return fail(
        SharedDomainException.invalidAverageValue(
          average.accept(formatVisitor),
          start.accept(formatVisitor),
          end.accept(formatVisitor),
        ),
      )
    }

    return success(new MagnitudeRange(props))
  }

  public toString(): string {
    const { start, average, end } = this._value

    let averageString = ''

    if (average) {
      averageString = `, avg: ${average.toString()}`
    }

    return `(${start.toString()}) - (${end.toString()})${averageString}`
  }

  public equals(vo?: MagnitudeRange<T> | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const { start, average, end } = this._value

    const bothHaveAverage = !!average && !!vo._value.average
    const neitherHasAverage = !average && !vo._value.average

    if (!neitherHasAverage) {
      if (!bothHaveAverage || !average?.equals(vo._value.average)) {
        return false
      }
    }

    return start.equals(vo._value.start) && end.equals(vo._value.end)
  }

  public isSingleValue(): boolean {
    return this._value.start.isEqual(this._value.end)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitMagnitudeRange(this)
  }

  public get start(): T {
    return this._value.start
  }

  public get end(): T {
    return this._value.end
  }

  public get average(): T | undefined {
    return this._value.average
  }

  public get unit(): string {
    return this._value.start.unit
  }

  public toPrimitives(): MagnitudeRangePrimitiveProps {
    const { start, end, average } = this._value
    const unit = start.unit

    return {
      start: start.toPrimitives(),
      end: end.toPrimitives(),
      average: average ? average.toPrimitives() : undefined,
      unit,
    }
  }
}
