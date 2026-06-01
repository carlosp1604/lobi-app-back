import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import { MagnitudeRange, MagnitudeRangePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'
import {
  Duration,
  DurationInputProps,
  DurationPrimitives,
  SupportedDurationUnits,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'

export type DurationCapabilityInputProps = {
  start: DurationInputProps
  end: DurationInputProps
}
export type DurationCapabilityPrimitives = MagnitudeRangePrimitives<DurationPrimitives>
export type DurationCapabilityUnit = (typeof DurationCapability.supportedUnits)[number]

export class DurationCapability
  extends ValueObject<MagnitudeRange<Duration, DurationPrimitives>>
  implements CapabilityInterface<DurationCapabilityPrimitives>
{
  public static readonly capabilityName = 'duration'
  public static readonly defaultUnit = Duration.DEFAULT_UNIT
  public static readonly supportedUnits = [...SupportedDurationUnits]
  public static readonly minDuration = Duration.MIN_DURATION_SECONDS
  public static readonly maxDuration = Duration.MAX_DURATION_SECONDS
  public static readonly conversionFactors = { [this.defaultUnit]: '1' }

  private constructor(durationRange: MagnitudeRange<Duration, DurationPrimitives>) {
    super(durationRange)
  }

  public static safeCreate(props: DurationCapabilityInputProps): Result<DurationCapability, ActivityDomainException> {
    const { end, start } = props

    const startDurationResult = Duration.safeCreate(start)
    if (!startDurationResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startDurationResult.error.message))
    }

    const startDuration = startDurationResult.value
    let endDuration = startDuration

    if (end) {
      const endDurationResult = Duration.safeCreate(end)

      if (!endDurationResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endDurationResult.error.message))
      }

      endDuration = endDurationResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<Duration, DurationPrimitives>(
      { start: startDuration, end: endDuration },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new DurationCapability(magnitudeRangeResult.value))
  }

  public static create(props: DurationCapabilityInputProps): DurationCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: DurationCapabilityPrimitives): DurationCapability {
    return new DurationCapability(MagnitudeRange.fromPrimitives(primitives, Duration))
  }

  public toPrimitives(): DurationCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: DurationCapability | null): boolean {
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

  public get minDuration(): Duration {
    return this._value.start
  }

  public get maxDuration(): Duration {
    return this._value.end
  }
}
