import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { ReconstitutableClass } from '~/src/modules/Shared/Domain/ReconstitutableClass'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export type Rangeable<T, P> = ValueObject<unknown> &
  OrderableMagnitudeInterface<T> &
  VisitableMagnitudeValueInterface &
  SerializableInterface<P>

export type MagnitudeRangeProps<T> = {
  start: T
  end: T
  average?: T
}

export type MagnitudeRangePrimitives<P> = {
  start: P
  end: P
  average?: P
  unit: string
}

export type MagnitudeRangeInputProps<T> = {
  start: T
  end: T
  average?: T
}

export class MagnitudeRange<T extends Rangeable<T, P>, P>
  extends ValueObject<MagnitudeRangeProps<T>>
  implements VisitableMagnitudeValueInterface, SerializableInterface<MagnitudeRangePrimitives<P>>
{
  private constructor(props: MagnitudeRangeProps<T>) {
    super(props)
  }

  public static safeCreate<T extends Rangeable<T, P>, P>(
    props: MagnitudeRangeInputProps<T>,
    formatVisitor: MagnitudeValueVisitorInterface<string>,
  ): Result<MagnitudeRange<T, P>, SharedDomainException> {
    const { start, end, average } = props

    if (start.unit !== end.unit) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.unit, end.unit))
    }

    if (average && average.unit !== start.unit) {
      return fail(SharedDomainException.invalidMagnitudeRange(start.unit, average.unit))
    }

    if (start.equals(end) && average) {
      return fail(SharedDomainException.redundantAverageValue(start.accept(formatVisitor), average.accept(formatVisitor)))
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

    return success(new MagnitudeRange<T, P>(props))
  }

  public static create<T extends Rangeable<T, P>, P>(
    props: MagnitudeRangeInputProps<T>,
    formatVisitor: MagnitudeValueVisitorInterface<string>,
  ): MagnitudeRange<T, P> {
    const safeCreateResult = this.safeCreate<T, P>(props, formatVisitor)

    if (!safeCreateResult.success) {
      throw safeCreateResult.error
    }

    return safeCreateResult.value
  }

  public static fromPrimitives<T extends Rangeable<T, P>, P>(
    primitives: MagnitudeRangePrimitives<P>,
    MagnitudeClass: ReconstitutableClass<T, P>,
  ): MagnitudeRange<T, P> {
    const start = MagnitudeClass.fromPrimitives(primitives.start)
    const end = MagnitudeClass.fromPrimitives(primitives.end)
    const average = primitives.average ? MagnitudeClass.fromPrimitives(primitives.average) : undefined

    return new MagnitudeRange<T, P>({ start, end, average })
  }

  public toString(): string {
    const { start, average, end } = this._value

    let averageString = ''

    if (average) {
      averageString = `, avg: ${average.toString()}`
    }

    return `(${start.toString()}) - (${end.toString()})${averageString}`
  }

  public equals(vo?: MagnitudeRange<T, P> | null): boolean {
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

  public toPrimitives(): MagnitudeRangePrimitives<P> {
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
