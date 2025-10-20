export interface RefreshSessionApplicationResponseDto {
  accessToken: string
  refreshToken: string
  sessionId: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}
