import type { FastifyReply } from 'fastify'
import { Env } from '~/src/modules/Shared/Infrastructure/env.schema'
import { ConfigService } from '@nestjs/config'

export const clearCookies = (response: FastifyReply, configService: ConfigService<Env, true>) => {
  const cookieBase = {
    path: '/',
    sameSite: 'strict' as const,
    httpOnly: true,
    secure: configService.get('isProduction', { infer: true }),
  }

  const refreshTokenCookieName = configService.get('REFRESH_COOKIE_NAME', { infer: true })
  const accessTokenCookieName = configService.get('ACCESS_COOKIE_NAME', { infer: true })

  response.clearCookie(refreshTokenCookieName, {
    ...cookieBase,
  })

  response.clearCookie(accessTokenCookieName, {
    ...cookieBase,
  })
}
