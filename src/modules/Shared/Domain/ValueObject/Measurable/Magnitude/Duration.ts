import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/Visitor/VisitableMagnitudeValueInterface'

export const SupportedDurationUnits = ['s'] as const
export type DurationUnit = (typeof SupportedDurationUnits)[number]

export type DurationPrimitiveProps = {
  value: number
  unit: string
  normalizedValue: number
}

export class Duration
  extends ValueObject<IntegerNumber>
  implements OrderableMagnitudeInterface<Duration>, VisitableMagnitudeValueInterface, SerializableInterface<DurationPrimitiveProps>
{
  private __durationBrand: void

  public static readonly DEFAULT_UNIT: DurationUnit = 's'
  public static readonly MAX_DURATION_SECONDS = IntegerNumber.fromNumber(259200)
  public static readonly MIN_DURATION_SECONDS = IntegerNumber.fromNumber(1)

  private constructor(value: IntegerNumber) {
    super(value)
  }

  public static safeCreate(value: number): Result<Duration, SharedDomainException> {
    const numericResult = IntegerNumber.safeCreate(value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.value, this.MAX_DURATION_SECONDS.value))
    }

    const totalSeconds = numericResult.value

    if (totalSeconds.isLessThan(this.MIN_DURATION_SECONDS) || totalSeconds.isGreaterThan(this.MAX_DURATION_SECONDS)) {
      return fail(SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.value, this.MAX_DURATION_SECONDS.value))
    }

    return success(new Duration(totalSeconds))
  }

  public static fromNumber(seconds: number): Duration {
    const result = this.safeCreate(seconds)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Duration | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(vo._value)
  }

  public toString(): string {
    return `${this._value.toString()} ${Duration.DEFAULT_UNIT}`
  }

  public toPrimitives(): DurationPrimitiveProps {
    const value = this._value

    return {
      unit: Duration.DEFAULT_UNIT,
      value: value.toPrimitives(),
      normalizedValue: value.toPrimitives(),
    }
  }

  public isGreaterThan(anotherMagnitude: Duration): boolean {
    return this._value.isGreaterThan(anotherMagnitude._value)
  }

  public isEqual(anotherMagnitude: Duration): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitDuration(this)
  }

  public get unit(): DurationUnit {
    return Duration.DEFAULT_UNIT
  }
}
