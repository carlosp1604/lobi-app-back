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

export interface ScalarCapabilitySchemaDto<U extends string> extends BaseCapabilitySchemaDto {
  type: 'scalar_range' | 'scalar_point'
  defaultUnit: U
  supportedUnits: Array<U>
  availableFields: Array<string>
  optionalFields: Array<string>
  limits: {
    min: string
    max: string
  }
  conversionFactors: Record<U, string>
}

export interface GeographicCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'geographic_range' | 'geographic_point'
}

export interface RouteCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'route'
  limits: {
    min: number
    max: number
  }
}

export interface MultipleChoiceCapabilitySchemaDto extends BaseCapabilitySchemaDto {
  type: 'multiple_choice'
  min: number
  max: number
  options: Array<unknown>
}
