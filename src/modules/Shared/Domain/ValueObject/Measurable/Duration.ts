import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Measurable/OrderableMagnitudeInterface'
import { VisitableMeasurableValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/VisitableMeasurableValueInterface'

export const SupportedDurationUnits = ['s'] as const
export type DurationUnit = (typeof SupportedDurationUnits)[number]

export class Duration
  extends ValueObject<BoundedNumber>
  implements OrderableMagnitudeInterface<Duration>, VisitableMeasurableValueInterface
{
  private __durationBrand: void

  public static readonly DEFAULT_UNIT: DurationUnit = 's'
  public static readonly MAX_DURATION_SECONDS = BoundedNumber.fromString('259200')
  public static readonly MIN_DURATION_SECONDS = BoundedNumber.fromString('1')

  private constructor(value: BoundedNumber) {
    super(value)
  }

  public static safeCreate(value: string): Result<Duration, SharedDomainException> {
    const numericResult = BoundedNumber.safeCreate(value)

    if (!numericResult.success) {
      return fail(
        SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.numericValue, this.MAX_DURATION_SECONDS.numericValue),
      )
    }

    const magnitude = numericResult.value

    if (magnitude.lessThan(this.MIN_DURATION_SECONDS) || magnitude.greaterThan(this.MAX_DURATION_SECONDS)) {
      return fail(
        SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.numericValue, this.MAX_DURATION_SECONDS.numericValue),
      )
    }

    const totalSeconds = magnitude.integerPart()
    return success(new Duration(BoundedNumber.fromString(String(totalSeconds))))
  }

  public static fromString(seconds: string): Duration {
    const result = this.safeCreate(seconds)
    if (!result.success) throw result.error
    return result.value
  }

  public toString(): string {
    return `${this._value.numericValue} ${Duration.DEFAULT_UNIT}`
  }

  public isGreaterThan(anotherMagnitude: Duration): boolean {
    return this._value.greaterThan(anotherMagnitude._value)
  }

  public isEqual(anotherMagnitude: Duration): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MeasurableValueVisitorInterface<R>): R {
    return visitor.visitDuration(this)
  }
}
