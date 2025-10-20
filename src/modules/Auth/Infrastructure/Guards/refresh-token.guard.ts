import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { ConfigService } from '@nestjs/config'
import { FastifyRequest } from 'fastify'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly refreshTokenCookieName: string

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.refreshTokenCookieName = this.configService.get('REFRESH_COOKIE_NAME', { infer: true })
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    const refreshToken = request.cookies?.[this.refreshTokenCookieName]

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException({
        code: UNAUTHORIZED_ACCESS,
        message: 'Unauthorized access',
      })
    }

    request['refreshToken'] = refreshToken

    return true
  }
}
