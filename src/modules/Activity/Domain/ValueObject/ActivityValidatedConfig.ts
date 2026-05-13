import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { SpecRegistry, SpecTypeMap } from '~/src/modules/Activity/Domain/Config/Spec/SpecRegistry'
import { CapabilityRegistry, CapabilityTypeMap } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityRegistry'

type KnownCapabilities = {
  [K in keyof CapabilityTypeMap]?: CapabilityTypeMap[K]['instance']
}

type KnownSpecs = {
  [K in keyof SpecTypeMap]?: SpecTypeMap[K]['instance']
}

export type ValidatedCapabilities = KnownCapabilities

export type ValidatedSpecs = KnownSpecs

export interface ActivityConfig {
  capabilities: ValidatedCapabilities
  specs: ValidatedSpecs
}

export interface ActivityValidatedConfigProps {
  config: ActivityConfig
}

export class ActivityValidatedConfig extends ValueObject<ActivityValidatedConfigProps> {
  private __activityValidatedConfigBrand: void

  private constructor(props: ActivityValidatedConfigProps) {
    super(props)
  }

  public static create(props: ActivityValidatedConfigProps): ActivityValidatedConfig {
    return new ActivityValidatedConfig(props)
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

  public get minDuration() {
    const { duration } = this._value.config.capabilities

    return duration ? duration.minDuration : null
  }

  public get maxDuration() {
    const { duration } = this._value.config.capabilities

    return duration ? duration.maxDuration : null
  }

  public getCapacities(): { min: IntegerNumber; max: IntegerNumber } {
    const capacitySource = this._value.config.specs.team_participants ?? this._value.config.specs.individual_participants

    return {
      min: capacitySource!.value.minCapacity,
      max: capacitySource!.value.maxCapacity,
    }
  }

  public getLocation(): Location | null {
    const { route, location, location_range } = this._value.config.capabilities

    if (route) {
      return route.startLocation
    }

    if (location_range) {
      return location_range.startLocation
    }

    return location ? location.location : null
  }

  public getLevels(): Array<Identifier> {
    const { ranking } = this._value.config.capabilities

    if (!ranking) {
      return []
    }

    return ranking.value
  }

  public equals(vo?: ActivityValidatedConfig | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    const thisCapabilities = this._value.config.capabilities
    const otherCapabilities = vo._value.config.capabilities

    const thisSpecs = this._value.config.specs
    const otherSpecs = vo._value.config.specs

    const thisCapabilitiesKeys = Object.keys(thisCapabilities) as Array<AvailableCapability>
    const otherCapabilitiesKeys = Object.keys(otherCapabilities) as Array<AvailableCapability>

    if (thisCapabilitiesKeys.length !== otherCapabilitiesKeys.length) {
      return false
    }

    const thisSpecsKeys = Object.keys(thisSpecs) as Array<AvailableSpec>
    const otherSpecsKeys = Object.keys(otherSpecs) as Array<AvailableSpec>

    if (thisSpecsKeys.length !== otherSpecsKeys.length) {
      return false
    }

    for (const key of thisCapabilitiesKeys) {
      const thisCapability = thisCapabilities[key] as CapabilityTypeMap[typeof key]['instance']
      const otherCapability = otherCapabilities[key]

      if (!otherCapability || !CapabilityRegistry.areEqual<typeof key>(thisCapability, otherCapability)) {
        return false
      }
    }

    for (const key of thisSpecsKeys) {
      const thisSpec = thisSpecs[key] as SpecTypeMap[typeof key]['instance']
      const otherSpec = otherSpecs[key]

      if (!otherSpec || !SpecRegistry.areEqual<typeof key>(thisSpec, otherSpec)) {
        return false
      }
    }

    return true
  }

  public toString(): string {
    return 'ValidatedActivityConfig'
  }
}
