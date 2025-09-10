import { FastifyAdapter } from '@nestjs/platform-fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const fastifyAdapter = new FastifyAdapter({
  genReqId: (request: FastifyRequest['raw']) => (request.headers['x-request-id'] as string) ?? crypto.randomUUID(),
  requestIdHeader: 'x-request-id',
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
        responseTime: response.elapsedTime,
      }),
    },
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'req.body.password',
      'req.body.token',
      'res.headers["set-cookie"]',
    ],
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
