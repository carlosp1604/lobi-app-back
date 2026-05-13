import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import { Speed, SpeedInputProps, SpeedPrimitives, SupportedSpeedUnits } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Speed'
import {
  MagnitudeRange,
  MagnitudeRangeInputProps,
  MagnitudeRangePrimitives,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'

export type SpeedCapabilityInputProps = MagnitudeRangeInputProps<SpeedInputProps>
export type SpeedCapabilityPrimitives = MagnitudeRangePrimitives<SpeedPrimitives>

export class SpeedCapability
  extends ValueObject<MagnitudeRange<Speed, SpeedPrimitives>>
  implements CapabilityInterface<SpeedCapabilityPrimitives>
{
  public static readonly capabilityName = 'speed'
  public static readonly defaultUnit = Speed.DEFAULT_UNIT
  public static readonly supportedUnits = [...SupportedSpeedUnits]
  public static readonly minSpeed = Speed.MIN_SPEED
  public static readonly maxSpeed = Speed.MAX_SPEED

  private constructor(speedRange: MagnitudeRange<Speed, SpeedPrimitives>) {
    super(speedRange)
  }

  public static safeCreate(props: SpeedCapabilityInputProps): Result<SpeedCapability, ActivityDomainException> {
    const { end, start, average } = props

    const startSpeedResult = Speed.safeCreate(start)

    if (!startSpeedResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startSpeedResult.error.message))
    }

    const startSpeed = startSpeedResult.value
    let endSpeed = startSpeed

    if (end) {
      const endSpeedResult = Speed.safeCreate(end)

      if (!endSpeedResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endSpeedResult.error.message))
      }

      endSpeed = endSpeedResult.value
    }

    let averageSpeed: Speed | undefined

    if (average) {
      const averageSpeedResult = Speed.safeCreate(average)

      if (!averageSpeedResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, averageSpeedResult.error.message))
      }

      averageSpeed = averageSpeedResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<Speed, SpeedPrimitives>(
      { start: startSpeed, end: endSpeed, average: averageSpeed },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new SpeedCapability(magnitudeRangeResult.value))
  }

  public static create(props: SpeedCapabilityInputProps): SpeedCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public toPrimitives(): SpeedCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public static fromPrimitives(primitives: SpeedCapabilityPrimitives): SpeedCapability {
    return new SpeedCapability(MagnitudeRange.fromPrimitives(primitives, Speed))
  }

  public equals(vo?: SpeedCapability | null): boolean {
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
