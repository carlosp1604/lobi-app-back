import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { Route } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Route'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/SportRankingSystem'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { ParticipationStrategy } from '~/src/modules/Activity/Domain/Sport/ParticipationStrategy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { AvailableCapability, Sport } from '~/src/modules/Activity/Domain/Sport/Sport'

export type ValidatedCapabilities = Partial<{
  altitude: MagnitudeRange<Altitude>
  distance: MagnitudeRange<Distance>
  duration: MagnitudeRange<Duration>
  location: Location
  location_range: LocationRange
  pace: MagnitudeRange<Pace>
  ranking: Array<SportRankingSystem>
  route: Route
  rpe: MagnitudeRange<RPE>
  speed: MagnitudeRange<Speed>
}>

export type ValidatedSpecs = { participants: ParticipationStrategy }

export interface ActivityConfig {
  capabilities: ValidatedCapabilities
  specs: ValidatedSpecs
}

export interface ActivityValidatedConfigProps {
  sportId: Identifier
  config: ActivityConfig
}

// TODO: Review - Move to Domain Service or Sport Factory?
export class ActivityValidatedConfig extends ValueObject<ActivityValidatedConfigProps> {
  private __activityValidatedConfigBrand: void

  private constructor(props: ActivityValidatedConfigProps) {
    super(props)
  }

  public static safeCreate(
    sport: Sport,
    capabilities: ValidatedCapabilities,
    specs: ValidatedSpecs,
  ): Result<ActivityValidatedConfig, SportDomainException> {
    const incorrectCapabilities = Object.keys(capabilities).filter(
      (capability) => !sport.capabilities.includes(capability as AvailableCapability),
    ) as Array<AvailableCapability>

    if (incorrectCapabilities.length > 0) {
      return fail(SportDomainException.unsupportedCapabilities(sport.id.value, incorrectCapabilities, sport.capabilities))
    }

    if (!specs.participants) {
      return fail(SportDomainException.missingActivitySpec(sport.id.value, 'participants'))
    }

    const config = { capabilities, specs }

    return success(new ActivityValidatedConfig({ sportId: sport.id, config }))
  }

  public static fromProps(sport: Sport, capabilities: ValidatedCapabilities, specs: ValidatedSpecs): ActivityValidatedConfig {
    const activityValidatedConfigResult = this.safeCreate(sport, capabilities, specs)

    if (!activityValidatedConfigResult.success) {
      throw activityValidatedConfigResult.error
    }

    return activityValidatedConfigResult.value
  }

  public get sportId(): Identifier {
    return this._value.sportId
  }

  public get config(): ActivityConfig {
    return this._value.config
  }

  public get capabilities(): ValidatedCapabilities {
    return this._value.config.capabilities
  }

  public get specs(): ValidatedSpecs {
    return this._value.config.specs
  }

  public getDurationRange(): MagnitudeRange<Duration> | null {
    return this._value.config.capabilities.duration ?? null
  }

  public getCapacities(): { min: IntegerNumber; max: IntegerNumber } {
    return {
      min: this._value.config.specs.participants.minCapacity,
      max: this._value.config.specs.participants.maxCapacity,
    }
  }

  public getLocation(): Location | null {
    if (this._value.config.capabilities.route) {
      return this._value.config.capabilities.route.points[0]
    }

    if (this._value.config.capabilities.location_range) {
      return this._value.config.capabilities.location_range.start
    }

    return this._value.config.capabilities.location ?? null
  }

  public getLevels(): Array<SportRankingSystem> {
    const ranking = this._value.config.capabilities.ranking

    if (!ranking) {
      return []
    }

    return ranking
  }

  public equals(vo?: ActivityValidatedConfig | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    if (!this._value.sportId.equals(vo.value.sportId)) {
      return false
    }

    return JSON.stringify(this._value.config) === JSON.stringify(vo.value.config)
  }

  public toString(): string {
    return `ValidatedActivityConfig(sportId: ${this._value.sportId.toString()})`
  }
}
