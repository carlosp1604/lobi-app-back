import { FastifyAdapter } from '@nestjs/platform-fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const fastifyAdapter = new FastifyAdapter({
  logger: {
    level: process.env.NODE_ENV !== 'production' ? 'info' : 'debug',
    serializers: {
      req: (request: FastifyRequest) => ({
        method: request.method,
        url: request.url,
        id: request.id,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }),
      res: (response: FastifyReply) => ({
        statusCode: response.statusCode,
      }),
    },
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
  },
})
