export type ValueType = 'scalar' | 'range' | 'geographic'

export type DisplayValue = {
  long: string
  short: string
}

export interface MagnitudeQueryDto {
  readonly type: ValueType
  readonly value: string
  readonly unit: string
  readonly conversions?: Record<string, string>
  readonly formatted: Record<string, DisplayValue>
  readonly format?: string | Array<string>
}

export interface MagnitudeRangeQueryDto {
  readonly type: ValueType
  readonly start: MagnitudeQueryDto
  readonly end: MagnitudeQueryDto
  readonly average?: MagnitudeQueryDto
  readonly isSingleValue: boolean
  readonly unit: string
}

export interface LocationQueryDto {
  readonly type: ValueType
  readonly lat: string
  readonly lng: string
}

export interface LocationRangeQueryDto {
  readonly type: ValueType
  readonly start: LocationQueryDto
  readonly end: LocationQueryDto
}
