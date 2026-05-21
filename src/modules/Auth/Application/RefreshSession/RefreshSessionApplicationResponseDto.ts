import { UserApplicationDto } from '~/src/modules/Auth/Application/Dto/UserApplicationDto'

export interface RefreshSessionApplicationResponseDto {
  readonly accessToken: string
  readonly refreshToken: string
  readonly sessionId: string
  readonly accessTokenExpiresAt: Date
  readonly refreshTokenExpiresAt: Date
  readonly userData: UserApplicationDto
}
