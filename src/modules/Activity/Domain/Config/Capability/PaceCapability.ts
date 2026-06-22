import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { PACE_FACTORS } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/PaceConverter'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import { Pace, PaceInputProps, PacePrimitives, PaceUnit } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Pace'
import {
  MagnitudeRange,
  MagnitudeRangeInputProps,
  MagnitudeRangePrimitives,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'

export type PaceCapabilityInputProps = MagnitudeRangeInputProps<PaceInputProps>
export type PaceCapabilityPrimitives = MagnitudeRangePrimitives<PacePrimitives>
export type PaceCapabilityUnit = (typeof PaceCapability.supportedUnits)[number]

export class PaceCapability
  extends ValueObject<MagnitudeRange<Pace, PacePrimitives>>
  implements CapabilityInterface<PaceCapabilityPrimitives>
{
  public static readonly capabilityName = 'pace'
  public static readonly defaultUnit: PaceUnit = 'min/km'
  public static readonly supportedUnits: Array<PaceUnit> = ['min/km', 'min/mi']
  public static readonly minPace = Pace.MIN_PACE
  public static readonly maxPace = Pace.MAX_PACE
  public static readonly conversionFactors = PACE_FACTORS

  private constructor(paceRange: MagnitudeRange<Pace, PacePrimitives>) {
    super(paceRange)
  }

  public static safeCreate(props: PaceCapabilityInputProps): Result<PaceCapability, ActivityDomainException> {
    const { end, start, average } = props

    const startPaceResult = Pace.safeCreate(start)

    if (!startPaceResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startPaceResult.error.message))
    }

    const startPace = startPaceResult.value
    let endPace = startPace

    if (end) {
      const endPaceResult = Pace.safeCreate(end)

      if (!endPaceResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endPaceResult.error.message))
      }

      endPace = endPaceResult.value
    }

    let averagePace: Pace | undefined

    if (average) {
      const averagePaceResult = Pace.safeCreate(average)

      if (!averagePaceResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, averagePaceResult.error.message))
      }

      averagePace = averagePaceResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<Pace, PacePrimitives>(
      { start: startPace, end: endPace, average: averagePace },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new PaceCapability(magnitudeRangeResult.value))
  }

  public static create(props: PaceCapabilityInputProps): PaceCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: PaceCapabilityPrimitives): PaceCapability {
    return new PaceCapability(MagnitudeRange.fromPrimitives(primitives, Pace))
  }

  public toPrimitives(): PaceCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: PaceCapability | null): boolean {
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
