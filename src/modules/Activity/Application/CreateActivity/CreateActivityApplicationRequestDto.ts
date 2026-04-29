export interface CreateActivityApplicationRequestDto {
  readonly userId: string
  readonly sportId: string
  readonly title: string
  readonly description: string | null
  readonly scheduledDate: Date
  readonly config: {
    readonly capabilities: Record<string, unknown>
    readonly specs: Record<string, unknown>
  }
}
