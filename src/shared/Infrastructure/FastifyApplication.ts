import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { env } from '~/src/shared/Infrastructure/EnvHelper'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '~/src/app.module'
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGINS,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 600,
}

const fastifyApplication = new FastifyAdapter({
  genReqId: (request: FastifyRequest['raw']) => (request.headers['x-request-id'] as string) ?? crypto.randomUUID(),
  requestIdHeader: 'x-request-id',
  bodyLimit: env.BODY_LIMIT_BYTES,
  trustProxy: env.TRUST_PROXY,
  caseSensitive: true,
  ignoreTrailingSlash: true,
  logger: {
    level: env.isProduction ? 'info' : 'debug',
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
    transport: env.isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
  },
})

export async function buildFastifyApplication(): Promise<NestFastifyApplication> {
  return NestFactory.create<NestFastifyApplication>(AppModule, fastifyApplication, { cors: corsOptions })
}
