export interface SportConfigQueryDto {
  readonly capabilities: Record<string, unknown>
  readonly specs: Record<string, unknown>
}

export interface SportDetailsQueryDto {
  readonly id: string
  readonly slug: string
  readonly image_url: string | null
  readonly config: SportConfigQueryDto
}

export interface GetSportsQueryResponseDto {
  readonly sports: Array<SportDetailsQueryDto>
  readonly count: number
}
