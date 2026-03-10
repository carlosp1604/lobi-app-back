import { FastifyRequest } from 'fastify'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'

export const AccessToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>()
  return request['user'] as JwtPayload | undefined
})
