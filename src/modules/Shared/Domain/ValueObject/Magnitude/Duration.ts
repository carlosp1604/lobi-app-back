import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export const SupportedDurationUnits = ['s'] as const
export type DurationUnit = (typeof SupportedDurationUnits)[number]

export type DurationInputProps = {
  value: string
  unit: string
}

export type DurationPrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export class Duration
  extends ValueObject<IntegerNumber>
  implements OrderableMagnitudeInterface<Duration>, VisitableMagnitudeValueInterface, SerializableInterface<DurationPrimitives>
{
  private __durationBrand: void

  public static readonly DEFAULT_UNIT: DurationUnit = 's'
  public static readonly MAX_DURATION_SECONDS = IntegerNumber.create(259200)
  public static readonly MIN_DURATION_SECONDS = IntegerNumber.create(1)

  private constructor(value: IntegerNumber) {
    super(value)
  }

  public static safeCreate(props: DurationInputProps): Result<Duration, SharedDomainException> {
    const { value, unit } = props

    const unitInput = unit.trim().toLowerCase()
    const isSupported = SupportedDurationUnits.includes(unitInput as DurationUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Duration', unit, [...SupportedDurationUnits]))
    }

    const numericResult = IntegerNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.value, this.MAX_DURATION_SECONDS.value))
    }

    const totalSeconds = numericResult.value

    if (totalSeconds.isLessThan(this.MIN_DURATION_SECONDS) || totalSeconds.isGreaterThan(this.MAX_DURATION_SECONDS)) {
      return fail(SharedDomainException.invalidDuration(value, this.MIN_DURATION_SECONDS.value, this.MAX_DURATION_SECONDS.value))
    }

    return success(new Duration(totalSeconds))
  }

  public static create(props: DurationInputProps): Duration {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: DurationPrimitives): Duration {
    return Duration.create({ value: primitives.value, unit: primitives.unit })
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

  public toPrimitives(): DurationPrimitives {
    const value = this._value

    return {
      unit: Duration.DEFAULT_UNIT,
      value: String(value.toPrimitives()),
      normalizedValue: String(value.toPrimitives()),
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
