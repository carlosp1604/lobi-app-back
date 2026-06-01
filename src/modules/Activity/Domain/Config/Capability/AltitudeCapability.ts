import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { ALTITUDE_FACTORS } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Converter/AltitudeConverter'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { MagnitudeToRepresentationVisitor } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeToRepresentationVisitor'
import {
  MagnitudeRange,
  MagnitudeRangeInputProps,
  MagnitudeRangePrimitives,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'
import {
  Altitude,
  AltitudeInputProps,
  AltitudePrimitives,
  SupportedAltitudeUnits,
} from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Altitude'

export type AltitudeCapabilityInputProps = MagnitudeRangeInputProps<AltitudeInputProps>
export type AltitudeCapabilityPrimitives = MagnitudeRangePrimitives<AltitudePrimitives>
export type AltitudeCapabilityUnit = (typeof AltitudeCapability.supportedUnits)[number]

export class AltitudeCapability
  extends ValueObject<MagnitudeRange<Altitude, AltitudePrimitives>>
  implements CapabilityInterface<AltitudeCapabilityPrimitives>
{
  public static readonly capabilityName = 'altitude'
  public static readonly defaultUnit = Altitude.DEFAULT_UNIT
  public static readonly supportedUnits = [...SupportedAltitudeUnits]
  public static readonly maxAltitude = Altitude.MAX_ALTITUDE
  public static readonly minAltitude = Altitude.MIN_ALTITUDE
  public static readonly conversionFactors = ALTITUDE_FACTORS

  private constructor(altitudeRange: MagnitudeRange<Altitude, AltitudePrimitives>) {
    super(altitudeRange)
  }

  public static safeCreate(props: AltitudeCapabilityInputProps): Result<AltitudeCapability, ActivityDomainException> {
    const { end, start, average } = props

    const startAltitudeResult = Altitude.safeCreate(start)

    if (!startAltitudeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, startAltitudeResult.error.message))
    }

    const startAltitude = startAltitudeResult.value
    let endAltitude = startAltitude

    if (end) {
      const endAltitudeResult = Altitude.safeCreate(end)

      if (!endAltitudeResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, endAltitudeResult.error.message))
      }

      endAltitude = endAltitudeResult.value
    }

    let averageAltitude: Altitude | undefined

    if (average) {
      const averageAltitudeResult = Altitude.safeCreate(average)

      if (!averageAltitudeResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, averageAltitudeResult.error.message))
      }

      averageAltitude = averageAltitudeResult.value
    }

    const representationVisitor = new MagnitudeToRepresentationVisitor()
    const magnitudeRangeResult = MagnitudeRange.safeCreate<Altitude, AltitudePrimitives>(
      { start: startAltitude, end: endAltitude, average: averageAltitude },
      representationVisitor,
    )

    if (!magnitudeRangeResult.success) {
      return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, magnitudeRangeResult.error.message))
    }

    return success(new AltitudeCapability(magnitudeRangeResult.value))
  }

  public static create(props: AltitudeCapabilityInputProps): AltitudeCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: AltitudeCapabilityPrimitives): AltitudeCapability {
    return new AltitudeCapability(MagnitudeRange.fromPrimitives(primitives, Altitude))
  }

  public toPrimitives(): AltitudeCapabilityPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: AltitudeCapability | null): boolean {
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
