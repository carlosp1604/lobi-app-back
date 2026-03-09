import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { ConfigService } from '@nestjs/config'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { GenerateTokensApplicationResponseDto } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationResponseDto'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'

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
    userId: Identifier,
    now: Date,
    userAgent: UserAgent,
    ipHash: UserSessionIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): Promise<GenerateTokensApplicationResponseDto> {
    const sessionId = Identifier.fromString(this.idGeneratorService.generateId())
    const clearSessionToken = await this.tokenGenerator.generateSessionToken()
    const newSessionHashedToken = await this.hasherService.hash(clearSessionToken)
    const sessionHash = UserSessionTokenHash.fromString(newSessionHashedToken)

    const session = UserSession.create(sessionId, userId, sessionHash, userAgent, this.refreshTokenTtlMs, now, ipHash, deviceLocation)

    const accessExpiresAt = new Date(now.getTime() + this.accessTokenTtlMs)
    const accessToken = await this.tokenGenerator.generateAccessToken(userId.value, sessionId.value, accessExpiresAt, now)

    return {
      session,
      accessToken,
      refreshToken: clearSessionToken,
      accessTokenExpiresAt: accessExpiresAt,
      refreshTokenExpiresAt: session.expiresAt,
    }
  }
}
