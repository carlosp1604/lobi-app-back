import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { MagnitudeRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { AvailableCapability, Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { ValidatedCapabilities, ValidatedSpecs } from '~/src/modules/Activity/Application/Sport/SportRegistry'

export interface RawActivityConfig {
  capabilities: Record<string, unknown>
  specs: Record<string, unknown>
}

export interface ActivityConfig {
  capabilities: ValidatedCapabilities
  specs: ValidatedSpecs
}

export interface ActivityValidatedConfigProps {
  sportId: Identifier
  config: ActivityConfig
}

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
      min: this._value.config.specs.participants!.minCapacity,
      max: this._value.config.specs.participants!.maxCapacity,
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

  public getLevelIds(): Array<Identifier> {
    const ranking = this._value.config.capabilities.ranking

    if (!ranking) {
      return []
    }

    return ranking.map((ranking) => ranking.id)
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
