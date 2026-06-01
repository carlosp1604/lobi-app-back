import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { DISTANCE_FACTORS } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/DistanceConverter'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import { MagnitudeRange, MagnitudeRangePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'
import {
  Distance,
  DistanceInputProps,
  DistancePrimitives,
  DistanceUnit,
  SupportedDistanceUnits,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Distance'

export type DistanceCapabilityInputProps = {
  start: DistanceInputProps
  end: DistanceInputProps
}
export type DistanceCapabilityPrimitives = MagnitudeRangePrimitives<DistancePrimitives>
export type DistanceCapabilityUnit = (typeof DistanceCapability.supportedUnits)[number]

export class DistanceCapability
  extends ValueObject<MagnitudeRange<Distance, DistancePrimitives>>
  implements CapabilityInterface<DistanceCapabilityPrimitives>
{
  public static readonly capabilityName = 'distance'
  public static readonly defaultUnit: DistanceUnit = 'km'
  public static readonly supportedUnits = [...SupportedDistanceUnits]
  public static readonly minDistance = Distance.MIN_DISTANCE
  public static readonly maxDistance = Distance.MAX_DISTANCE
  public static readonly conversionFactors = DISTANCE_FACTORS

  private constructor(distanceRange: MagnitudeRange<Distance, DistancePrimitives>) {
    super(distanceRange)
  }

  public static safeCreate(props: DistanceCapabilityInputProps): Result<DistanceCapability, ActivityDomainException> {
    const { end, start } = props

    const startDistanceResult = Distance.safeCreate(start)

    if (!startDistanceResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startDistanceResult.error.message))
    }

    const startDistance = startDistanceResult.value
    let endDistance = startDistance

    if (end) {
      const endDistanceResult = Distance.safeCreate(end)

      if (!endDistanceResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endDistanceResult.error.message))
      }

      endDistance = endDistanceResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<Distance, DistancePrimitives>(
      { start: startDistance, end: endDistance },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new DistanceCapability(magnitudeRangeResult.value))
  }

  public static create(props: DistanceCapabilityInputProps): DistanceCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: DistanceCapabilityPrimitives): DistanceCapability {
    return new DistanceCapability(MagnitudeRange.fromPrimitives(primitives, Distance))
  }

  public toPrimitives(): DistanceCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: DistanceCapability | null): boolean {
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
