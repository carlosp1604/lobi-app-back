import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/BoundedNumber'
import { SpeedConverter } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/SpeedConverter'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { OrderableMagnitudeInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/OrderableMagnitudeInterface'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'
import { VisitableMagnitudeValueInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/VisitableMagnitudeValueInterface'

export const SupportedSpeedUnits = ['km/h', 'mi/h'] as const
export type SpeedUnit = (typeof SupportedSpeedUnits)[number]

export type SpeedProps = {
  value: BoundedNumber
  unit: SpeedUnit
  normalizedValue: BoundedNumber
}

export type SpeedPrimitives = {
  value: string
  unit: string
  normalizedValue: string
}

export type SpeedInputProps = {
  value: string
  unit: string
}

export class Speed
  extends ValueObject<SpeedProps>
  implements OrderableMagnitudeInterface<Speed>, VisitableMagnitudeValueInterface, SerializableInterface<SpeedPrimitives>
{
  private __speedBrand: void

  public static readonly DEFAULT_UNIT: SpeedUnit = 'km/h'
  public static readonly MIN_SPEED = BoundedNumber.create('0')
  public static readonly MAX_SPEED = BoundedNumber.create('2000')

  private constructor(props: SpeedProps) {
    super(props)
  }

  public static safeCreate(props: SpeedInputProps): Result<Speed, SharedDomainException> {
    const unitInput = props.unit.trim().toLowerCase()
    const isSupported = SupportedSpeedUnits.includes(unitInput as SpeedUnit)

    if (!isSupported) {
      return fail(SharedDomainException.invalidUnit('Speed', props.unit, [...SupportedSpeedUnits]))
    }

    const normalizedUnit = unitInput as SpeedUnit
    const numericResult = BoundedNumber.safeCreate(props.value)

    if (!numericResult.success) {
      return fail(SharedDomainException.invalidSpeed(props.value, this.MIN_SPEED.stringValue, this.MAX_SPEED.stringValue))
    }

    const value = numericResult.value
    let normalizedValue = value

    if (normalizedUnit !== this.DEFAULT_UNIT) {
      normalizedValue = BoundedNumber.create(SpeedConverter.convert(value.numericValue, normalizedUnit, this.DEFAULT_UNIT).toFixed())
    }

    if (normalizedValue.isLessThan(this.MIN_SPEED) || normalizedValue.isGreaterThan(this.MAX_SPEED)) {
      return fail(SharedDomainException.invalidSpeed(props.value, this.MIN_SPEED.stringValue, this.MAX_SPEED.stringValue))
    }

    return success(new Speed({ value, unit: normalizedUnit, normalizedValue }))
  }

  public static create(props: SpeedInputProps): Speed {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: SpeedPrimitives): Speed {
    return Speed.create({ value: primitives.value, unit: primitives.unit })
  }

  public equals(vo?: Speed | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.normalizedValue.equals(vo._value.normalizedValue)
  }

  public toString(): string {
    const { value, unit } = this._value

    return `${value.toString()} ${unit}`
  }

  public toPrimitives(): SpeedPrimitives {
    const { unit, value, normalizedValue } = this._value

    return {
      unit,
      value: value.toPrimitives(),
      normalizedValue: normalizedValue.toPrimitives(),
    }
  }

  public isGreaterThan(anotherMagnitude: Speed): boolean {
    return this._value.normalizedValue.isGreaterThan(anotherMagnitude.value.normalizedValue)
  }

  public isEqual(anotherMagnitude: Speed): boolean {
    return this.equals(anotherMagnitude)
  }

  public accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R {
    return visitor.visitSpeed(this)
  }

  public get unit(): SpeedUnit {
    return this._value.unit
  }
}
