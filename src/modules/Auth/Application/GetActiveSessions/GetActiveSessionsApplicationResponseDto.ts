export interface DeviceInfoApplicationDto {
  raw: string
  browser: {
    name: string | null
    version: string | null
  }
  os: {
    name: string | null
    version: string | null
  }
  hardware: {
    type: string | null
    vendor: string | null
    model: string | null
  }
}

export interface GetActiveSessionsUserSessionApplicationDto {
  id: string
  deviceCountryCode: string | null
  deviceCity: string | null
  deviceInfo: DeviceInfoApplicationDto
  activeSince: Date
  expiresAt: Date
  isCurrent: boolean
}

export interface GetActiveSessionsApplicationResponseDto {
  sessions: Array<GetActiveSessionsUserSessionApplicationDto>
}
