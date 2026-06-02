export type DisplayValue = {
  long: string
  short: string
}

export interface MagnitudeDto {
  readonly value: string
  readonly unit: string
  readonly conversions?: Record<string, string>
  readonly formatted: Record<string, DisplayValue>
  readonly format?: string | Array<string>
}

export interface MagnitudeRangeDto {
  readonly start: MagnitudeDto
  readonly end: MagnitudeDto
  readonly average?: MagnitudeDto
  readonly isSingleValue: boolean
  readonly unit: string
}

export interface LocationDto {
  readonly lat: string
  readonly lng: string
}

export interface LocationRangeDto {
  readonly start: LocationDto
  readonly end: LocationDto
}
