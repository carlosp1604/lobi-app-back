export interface RefreshSessionApplicationRequestDto {
  token: string
  ip: string
  userAgent: string | undefined
}
