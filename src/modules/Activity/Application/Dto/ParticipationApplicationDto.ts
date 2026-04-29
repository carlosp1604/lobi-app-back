export interface ParticipationApplicationDto {
  readonly id: string
  readonly activityId: string
  readonly userId: string
  readonly joinedAt: Date
  readonly leftAt: Date | null
}
