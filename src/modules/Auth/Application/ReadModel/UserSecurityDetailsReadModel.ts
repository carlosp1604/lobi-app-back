export interface LocalCredentialDetailsReadModel {
  created_at: string
  updated_at: string
}

export interface UserSessionDetailsReadModel {
  id: string
  device_country_code: string | null
  device_city: string | null
  created_at: string
  device_info: {
    raw: string
    browser: { name: string | null; version: string | null }
    os: { name: string | null; version: string | null }
    hardware: { type: string | null; vendor: string | null; model: string | null }
  }
  expires_at: string
}

export interface UserSecurityDetailsReadModel {
  credential: LocalCredentialDetailsReadModel
  sessions: Array<UserSessionDetailsReadModel>
}
