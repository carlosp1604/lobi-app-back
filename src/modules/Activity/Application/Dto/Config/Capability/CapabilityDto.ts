import { RouteDto } from '~/src/modules/Shared/Application/DTO/RouteDto'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { LocationDto, LocationRangeDto, MagnitudeDto, MagnitudeRangeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'

export type CapabilityDtoType = 'scalar_range' | 'scalar_point' | 'geographic_range' | 'geographic_point' | 'route' | 'multiple_choice'

export type BaseCapabilityDto = {
  readonly name: AvailableCapability
  readonly type: CapabilityDtoType
}

export interface MagnitudeCapabilityDto extends BaseCapabilityDto {
  readonly type: 'scalar_point'
  readonly data: MagnitudeDto
}

export interface MagnitudeRangeCapabilityDto extends BaseCapabilityDto {
  readonly type: 'scalar_range'
  readonly data: MagnitudeRangeDto
}

export interface LocationCapabilityDto extends BaseCapabilityDto {
  readonly type: 'geographic_point'
  readonly data: LocationDto
}

export interface LocationRangeCapabilityDto extends BaseCapabilityDto {
  readonly type: 'geographic_range'
  readonly data: LocationRangeDto
}

export interface RouteCapabilityDto extends BaseCapabilityDto {
  readonly type: 'route'
  readonly data: RouteDto
}

export interface MultipleChoiceCapabilityDto extends BaseCapabilityDto {
  readonly type: 'multiple_choice'
  readonly data: {
    readonly ids: Array<string>
  }
}
