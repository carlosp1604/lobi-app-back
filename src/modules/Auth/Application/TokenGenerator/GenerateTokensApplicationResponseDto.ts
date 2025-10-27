import { UserSession } from '~/src/modules/Auth/Domain/UserSession'

export interface GenerateTokensApplicationResponseDto {
  session: UserSession
  refreshToken: string
  accessToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}
