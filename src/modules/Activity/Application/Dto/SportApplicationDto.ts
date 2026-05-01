export interface SportConfigurationApplicationDto {
  readonly capabilities: Record<string, unknown>
  readonly specs: Record<string, unknown>
}

export interface SportApplicationDto {
  readonly id: string
  readonly slug: string
  readonly imageUrl: string | null
  readonly config: SportConfigurationApplicationDto
}
