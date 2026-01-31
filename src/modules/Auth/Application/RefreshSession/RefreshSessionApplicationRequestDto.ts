export interface RefreshSessionApplicationRequestDto {
  token: string
  userId: string
  ip: string
  userAgent: string | undefined
}
