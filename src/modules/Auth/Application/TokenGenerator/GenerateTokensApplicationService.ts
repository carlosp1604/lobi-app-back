import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { ConfigService } from '@nestjs/config'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { GenerateTokensApplicationResponseDto } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationResponseDto'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'

export class GenerateTokensApplicationService {
  private readonly refreshTokenTtlMs: number
  private readonly accessTokenTtlMs: number

  constructor(
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly tokenGenerator: TokenGeneratorApplicationServiceInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.refreshTokenTtlMs = this.configService.get('REFRESH_TTL_MS', { infer: true })
    this.accessTokenTtlMs = this.configService.get('ACCESS_TTL_MS', { infer: true })
  }

  public async generate(
    userId: UserId,
    now: Date,
    userAgent: UserAgent,
    ipHash: UserSessionIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): Promise<GenerateTokensApplicationResponseDto> {
    const sessionId = UserSessionId.fromString(this.idGeneratorService.generateId())
    const clearSessionToken = await this.tokenGenerator.generateSessionToken()
    const newSessionHashedToken = await this.hasherService.hash(clearSessionToken)
    const sessionHash = UserSessionTokenHash.fromString(newSessionHashedToken)

    const session = UserSession.create(sessionId, userId, sessionHash, userAgent, this.refreshTokenTtlMs, now, ipHash, deviceLocation)

    const accessExpiresAt = new Date(now.getTime() + this.accessTokenTtlMs)
    const accessToken = await this.tokenGenerator.generateAccessToken(userId.toString(), sessionId.toString(), accessExpiresAt, now)

    return {
      session,
      accessToken,
      refreshToken: clearSessionToken,
      accessTokenExpiresAt: accessExpiresAt,
      refreshTokenExpiresAt: session.expiresAt,
    }
  }
}
