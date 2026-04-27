export type DisplayValue = {
  long: string
  short: string
}

export interface MagnitudeApplicationDto {
  readonly type: 'scalar'
  readonly value: number | string
  readonly unit: string
  readonly conversions?: Record<string, number>
  readonly formatted: Record<string, DisplayValue>
  readonly format?: string | Array<string>
}

export interface MagnitudeRangeApplicationDto {
  readonly type: 'range'
  readonly start: MagnitudeApplicationDto
  readonly end: MagnitudeApplicationDto
  readonly average?: MagnitudeApplicationDto
  readonly isSingleValue: boolean
  readonly unit: string
}
