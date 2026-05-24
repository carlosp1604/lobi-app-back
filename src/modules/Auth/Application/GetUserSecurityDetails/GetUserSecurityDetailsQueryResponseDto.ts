export interface RelativeDateDto {
  readonly quantity: number
  readonly unit: 'minutes' | 'hours' | 'days' | 'months' | 'years'
}

export interface DeviceInfoDto {
  readonly raw: string
  readonly browser: {
    readonly name: string | null
    readonly version: string | null
  }
  readonly os: {
    readonly name: string | null
    readonly version: string | null
  }
  readonly hardware: {
    readonly type: string | null
    readonly vendor: string | null
    readonly model: string | null
  }
}

export interface DeviceLocationDto {
  readonly countryCode: string | null
  readonly city: string | null
}

export interface UserActiveSessionsDto {
  readonly id: string
  readonly deviceLocation: DeviceLocationDto
  readonly deviceInfo: DeviceInfoDto
  readonly activeSince: RelativeDateDto
  readonly expiresAt: RelativeDateDto
  readonly isCurrent: boolean
}

export interface UserCredentialDto {
  readonly lastModifiedAt: RelativeDateDto
}

export interface GetUserSecurityDetailsQueryResponseDto {
  readonly sessions: Array<UserActiveSessionsDto>
  readonly credential: UserCredentialDto
}
