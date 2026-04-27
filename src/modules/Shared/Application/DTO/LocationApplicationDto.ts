export interface LocationApplicationDto {
  readonly type: 'geographic'
  readonly lat: string
  readonly lng: string
}

export interface LocationRangeApplicationDto {
  readonly type: 'range'
  readonly start: LocationApplicationDto
  readonly end: LocationApplicationDto
}
