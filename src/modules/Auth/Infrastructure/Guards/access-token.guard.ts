import * as jwt from 'jsonwebtoken'
import { z } from 'zod'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'
import { ConfigService } from '@nestjs/config'
import { FastifyRequest } from 'fastify'
import { JwtPayloadSchema } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly logger = new Logger(AccessTokenGuard.name)
  private readonly jwtAccessSecret: string
  private readonly jwtIssuer: string
  private readonly jwtAudience: string
  private readonly accessTokenCookieName: string

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.jwtAccessSecret = this.configService.get('ACCESS_SECRET', { infer: true })
    this.jwtIssuer = this.configService.get('ACCESS_ISSUER', { infer: true })
    this.jwtAudience = this.configService.get('ACCESS_AUDIENCE', { infer: true })
    this.accessTokenCookieName = this.configService.get('ACCESS_COOKIE_NAME', { infer: true })
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    const token = request.cookies?.[this.accessTokenCookieName]

    if (!token) {
      throw new UnauthorizedException({
        code: UNAUTHORIZED_ACCESS,
        message: 'Unauthorized access',
      })
    }

    let payload: Record<string, unknown>

    try {
      payload = jwt.verify(token, this.jwtAccessSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }) as Record<string, unknown>
    } catch (exception: unknown) {
      const normalized = ErrorUtils.normalize(exception)

      const logContext = {
        path: request.url,
        tokenPrefix: token.substring(0, 10),
      }

      if (exception instanceof JsonWebTokenError) {
        this.logger.warn('JWT verification failed', {
          ...logContext,
          reason: exception instanceof TokenExpiredError ? 'Token expired' : exception.message,
          error: normalized.message,
        })
      } else {
        this.logger.error('Unexpected error during JWT verification', normalized.stack, {
          ...logContext,
          error: normalized.message,
        })
      }

      throw new UnauthorizedException({
        code: UNAUTHORIZED_ACCESS,
        message: 'Unauthorized access',
      })
    }

    const validationResult = JwtPayloadSchema.safeParse(payload)

    if (!validationResult.success) {
      this.logger.warn('Invalid JWT payload structure', {
        path: request.url,
        reason: 'Payload schema validation failed',
        tokenPrefix: token.substring(0, 10),
        validationErrors: z.treeifyError(validationResult.error),
        payload,
      })

      throw new UnauthorizedException({
        code: UNAUTHORIZED_ACCESS,
        message: 'Unauthorized access',
      })
    }

    request['user'] = validationResult.data

    return true
  }
}
