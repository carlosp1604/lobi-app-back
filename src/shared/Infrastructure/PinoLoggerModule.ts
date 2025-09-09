import { Module, Global } from '@nestjs/common'
import pino, { Logger } from 'pino'
import { PinoLoggerService } from '~/src/shared/Infrastructure/PinoLoggerService'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
import { HttpLogger, pinoHttp } from 'pino-http'
import type { IncomingMessage, ServerResponse } from 'http'

export const PINO_LOGGER = 'PINO_LOGGER'
export const PINO_HTTP = 'PINO_HTTP'

@Global()
@Module({
  providers: [
    {
      provide: PINO_LOGGER,
      useFactory: (): Logger =>
        pino({
          level: process.env.LOG_LEVEL || 'info',
          transport:
            process.env.NODE_ENV !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true },
                }
              : undefined,
        }),
    },
    {
      provide: PINO_HTTP,
      inject: [PINO_LOGGER],
      useFactory: (logger: Logger): HttpLogger =>
        pinoHttp({
          logger,
          autoLogging: true,
          serializers: {
            req: (request: IncomingMessage) => ({
              method: request.method,
              url: request.url,
              id: request.id,
            }),
            res: (response: ServerResponse) => ({
              statusCode: response.statusCode,
            }),
          },
        }),
    },
    {
      provide: LOGGER_SERVICE_INTERFACE,
      useFactory: (base: Logger): LoggerServiceInterface => new PinoLoggerService(base),
      inject: [PINO_LOGGER],
    },
  ],
  exports: [LOGGER_SERVICE_INTERFACE],
})
export class PinoLoggerModule {}
