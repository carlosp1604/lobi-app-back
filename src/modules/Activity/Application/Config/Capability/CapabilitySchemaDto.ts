import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'

export type CapabilitySchemaType =
  | 'scalar_range'
  | 'scalar_point'
  | 'geographic_range'
  | 'geographic_point'
  | 'route'
  | 'multiple_choice'

export interface BaseCapabilitySchemaDto {
  name: AvailableCapability
  type: CapabilitySchemaType
  isRequired: boolean
}

export interface ScalarCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'scalar_range' | 'scalar_point'
  defaultUnit: string
  supportedUnits: Array<string>
  availableFields: Array<string>
  optionalFields: Array<string>
  limits: {
    min: string
    max: string
  }
}

export interface GeographicCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'geographic_range' | 'geographic_point'
}

export interface RouteCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'route'
  limits: {
    min: string
    max: string
  }
}

export interface MultipleChoiceCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'multiple_choice'
  min: string
  max: string
  options: Array<unknown>
}
