import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { GenerateTokensApplicationResponseDto } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationResponseDto'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'

export class GenerateTokensApplicationService {
  constructor(
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly tokenGenerator: TokenGeneratorApplicationServiceInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  public async generate(
    userId: UserId,
    now: Date,
    userAgent: UserAgent,
    ipHash: UserSessionIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): Promise<GenerateTokensApplicationResponseDto> {
    const sessionId = UserSessionId.fromString(this.idGeneratorService.generateId())
    const sessionExpiresAt = new Date(now.getTime() + this.configService.get('REFRESH_TTL_MS', { infer: true }))
    const clearSessionToken = await this.tokenGenerator.generateSessionToken()
    const newSessionHashedToken = await this.hasherService.hash(clearSessionToken)
    const sessionHash = UserSessionHash.fromString(newSessionHashedToken)

    const session = UserSession.create(sessionId, userId, sessionHash, userAgent, sessionExpiresAt, now, ipHash, deviceLocation)

    const accessExpiresAt = new Date(now.getTime() + this.configService.get('ACCESS_TTL_MS', { infer: true }))
    const accessToken = await this.tokenGenerator.generateAccessToken(userId.toString(), sessionId.toString(), accessExpiresAt, now)

    return {
      session,
      accessToken,
      refreshToken: clearSessionToken,
      accessTokenExpiresAt: accessExpiresAt,
      refreshTokenExpiresAt: sessionExpiresAt,
    }
  }
}
