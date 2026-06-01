import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import { RPE, RPEInputProps, RPEPrimitives, ValidRPEValue } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import {
  MagnitudeRange,
  MagnitudeRangeInputProps,
  MagnitudeRangePrimitives,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'

export type RPECapabilityInputProps = MagnitudeRangeInputProps<RPEInputProps>
export type RPECapabilityPrimitives = MagnitudeRangePrimitives<RPEPrimitives>
export type RPECapabilityUnit = (typeof RPECapability.supportedUnits)[number]

export class RPECapability
  extends ValueObject<MagnitudeRange<RPE, RPEPrimitives>>
  implements CapabilityInterface<RPECapabilityPrimitives>
{
  public static readonly capabilityName = 'rpe'
  public static readonly defaultUnit = RPE.DEFAULT_UNIT
  public static readonly supportedUnits = [RPE.DEFAULT_UNIT]
  public static readonly minRPE = ValidRPEValue.ONE
  public static readonly maxRPE = ValidRPEValue.TEN
  public static readonly conversionFactors = { [this.defaultUnit]: '1' }

  private constructor(rpeRange: MagnitudeRange<RPE, RPEPrimitives>) {
    super(rpeRange)
  }

  public static safeCreate(props: RPECapabilityInputProps): Result<RPECapability, ActivityDomainException> {
    const { end, start, average } = props

    const startRPEResult = RPE.safeCreate(start)

    if (!startRPEResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startRPEResult.error.message))
    }

    const startRPE = startRPEResult.value
    let endRPE = startRPE

    if (end) {
      const endRPEResult = RPE.safeCreate(end)

      if (!endRPEResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endRPEResult.error.message))
      }

      endRPE = endRPEResult.value
    }

    let averageRPE: RPE | undefined

    if (average) {
      const averageRPEResult = RPE.safeCreate(average)

      if (!averageRPEResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, averageRPEResult.error.message))
      }

      averageRPE = averageRPEResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<RPE, RPEPrimitives>(
      { start: startRPE, end: endRPE, average: averageRPE },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new RPECapability(magnitudeRangeResult.value))
  }

  public static create(props: RPECapabilityInputProps): RPECapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: RPECapabilityPrimitives): RPECapability {
    return new RPECapability(MagnitudeRange.fromPrimitives(primitives, RPE))
  }

  public toPrimitives(): RPECapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: RPECapability | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(vo._value)
  }

  public toString(): string {
    return this._value.toString()
  }
}
