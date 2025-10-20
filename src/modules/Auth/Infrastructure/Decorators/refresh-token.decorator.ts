import { FastifyRequest } from 'fastify'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const RefreshTokenDecorator = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>()
  return request['refreshToken'] as string | undefined
})
