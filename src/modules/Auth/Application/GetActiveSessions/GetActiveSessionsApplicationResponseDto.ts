export interface GetActiveSessionsUserSessionApplicationDto {
  id: string
  deviceCountryCode: string | null
  deviceCity: string | null
  userAgent: string
  activeSince: Date
  expiresAt: Date
  isCurrent: boolean
}

export interface GetActiveSessionsApplicationResponseDto {
  sessions: Array<GetActiveSessionsUserSessionApplicationDto>
}
