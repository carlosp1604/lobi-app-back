import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export const SupportedDistanceUnits = ['m', 'km'] as const
export type DistanceUnit = (typeof SupportedDistanceUnits)[number]

export type DistanceProps = {
  value: number
  unit: DistanceUnit
}

export class Distance extends ValueObject<DistanceProps> {
  private __distanceBrand: void

  public static readonly M_TO_KM_CONVERSION = 1000

  private constructor(props: DistanceProps) {
    super(props)
  }

  public static safeCreate(props: { value: number; unit: string }): Result<Distance, SharedDomainException> {
    const normalizedUnit = props.unit.trim().toLowerCase() as DistanceUnit

    if (!SupportedDistanceUnits.includes(normalizedUnit)) {
      return fail(SharedDomainException.invalidUnit('Distance', props.unit, [...SupportedDistanceUnits]))
    }

    if (isNaN(props.value) || props.value <= 0) {
      return fail(SharedDomainException.invalidDistance(String(props.value)))
    }

    const meters = normalizedUnit === 'km' ? props.value * this.M_TO_KM_CONVERSION : props.value

    return success(new Distance({ value: meters, unit: 'm' }))
  }

  public static fromProps(props: { value: number; unit: string }): Distance {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public equals(vo?: Distance | null): boolean {
    if (vo === null || vo === undefined || vo.constructor !== this.constructor) {
      return false
    }

    return this._value.value === vo._value.value
  }

  public toString(): string {
    return `${this._value.value} ${this._value.unit}`
  }

  public toDTO() {
    const kilometers = this._value.value / Distance.M_TO_KM_CONVERSION

    return {
      value: this._value.value,
      unit: this._value.unit,
      meters: this._value.value,
      conversions: {
        m: this._value.value,
        km: kilometers,
      },
    }
  }
}
