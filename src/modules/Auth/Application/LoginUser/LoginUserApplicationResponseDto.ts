export interface LoginUserApplicationResponseDto {
  accessToken: string
  refreshToken: string
  sessionId: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}
