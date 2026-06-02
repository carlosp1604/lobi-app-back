export type DisplayValue = {
  long: string
  short: string
}

export interface MagnitudeQueryDto {
  readonly value: string
  readonly unit: string
  readonly conversions?: Record<string, string>
  readonly formatted: Record<string, DisplayValue>
  readonly format?: string | Array<string>
}

export interface MagnitudeRangeQueryDto {
  readonly start: MagnitudeQueryDto
  readonly end: MagnitudeQueryDto
  readonly average?: MagnitudeQueryDto
  readonly isSingleValue: boolean
  readonly unit: string
}

export interface LocationQueryDto {
  readonly lat: string
  readonly lng: string
}

export interface LocationRangeQueryDto {
  readonly start: LocationQueryDto
  readonly end: LocationQueryDto
}
